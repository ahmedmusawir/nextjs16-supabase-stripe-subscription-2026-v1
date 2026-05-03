# SUBSCRIPTION SYSTEM

> **Deep dive:** how StarkReads' subscription engine works end to end.
> **Last reviewed:** 2026-05-03

---

## Table of Contents

1. [Tier Model](#1-tier-model)
2. [`meetsTier()` and `TIER_LEVELS`](#2-meetstier-and-tier_levels)
3. [The Three Gate Helpers](#3-the-three-gate-helpers)
4. [Stripe Object Model](#4-stripe-object-model)
5. [Price ID ↔ Tier Resolution](#5-price-id--tier-resolution-the-tierresolver)
6. [Checkout Flow (Step by Step)](#6-checkout-flow-step-by-step)
7. [Webhook Handler (Step by Step)](#7-webhook-handler-step-by-step)
8. [Success-Page Polling Pattern](#8-success-page-polling-pattern)
9. [Customer Portal Integration](#9-customer-portal-integration)
10. [The Double-Subscription Bug & Fix](#10-the-double-subscription-bug--fix)
11. [What's Deferred to Phase 3](#11-whats-deferred-to-phase-3)

---

## 1. Tier Model

The system has **four tiers** with strict cumulative ordering: each higher tier includes everything a lower tier has access to.

| Tier | Level | Price (USD/mo) | Has access to |
|------|-------|----------------|---------------|
| `free` | 0 | $0 | Free articles, public pages |
| `starter` | 1 | $5 | Above + starter-tier articles |
| `pro` | 2 | $15 | Above + pro-tier articles |
| `enterprise` | 3 | $49 | Above + enterprise-tier articles |

Defined in `src/types/subscription.ts`:

```ts
export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'enterprise';

export const TIER_LEVELS: Record<SubscriptionTier, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  enterprise: 3,
} as const;
```

**Important:** `free` is **not stored as a row** in the `subscriptions` table — the table's `tier` column has a CHECK constraint allowing only `'starter'`, `'pro'`, `'enterprise'`. A user with no row defaults to `tier: 'free'` in application code (`src/services/subscriptionService.ts`).

---

## 2. `meetsTier()` and `TIER_LEVELS`

The cumulative hierarchy check, defined in `src/lib/tiers.ts`:

```ts
import { TIER_LEVELS, type SubscriptionTier } from '@/types/subscription';

export function meetsTier(
  current: SubscriptionTier,
  required: SubscriptionTier
): boolean {
  return TIER_LEVELS[current] >= TIER_LEVELS[required];
}

export function tierDisplayName(tier: SubscriptionTier): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}
```

### Coverage matrix

|  required ▶<br>▼ current | free | starter | pro | enterprise |
|---|---|---|---|---|
| **free** | ✅ | ❌ | ❌ | ❌ |
| **starter** | ✅ | ✅ | ❌ | ❌ |
| **pro** | ✅ | ✅ | ✅ | ❌ |
| **enterprise** | ✅ | ✅ | ✅ | ✅ |

Tested exhaustively in `src/__tests__/lib/pure-functions.test.ts` (see `docs/TESTING.md § 3`).

### Why a numeric ladder

A simple `Record<Tier, number>` lookup beats every alternative:
- **Faster than `switch`** — direct object property access
- **Easier to extend** — add a new tier and a number, done
- **Easy to reason about** — `a >= b` is trivial
- **Easy to test** — 16 combinations is just 16 assertions

---

## 3. The Three Gate Helpers

The codebase has three layers of access control. They compose: **auth → role → tier**.

### 3.1 `requireUser` (implicit, via `userService.getCurrentUser()`)

Strictly speaking there is no exported `requireUser()` — the pattern is just calling `userService.getCurrentUser()` and redirecting on null. This pattern is wrapped inside the other two gates.

```ts
const user = await userService.getCurrentUser();
if (!user) redirect('/auth?next=' + encodeURIComponent(currentPath));
```

### 3.2 `getUserRole(userId)` and role gating

Defined in `src/utils/get-user-role.ts`:

```ts
export enum AppRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export async function getUserRole(userId: string): Promise<AppRole | null>
```

Used by:
- Layouts: `src/app/(admin)/layout.tsx` and `src/app/(superadmin)/layout.tsx` redirect away non-admin / non-superadmin users
- Server actions: every privileged action under `src/app/(admin)/admin-portal/actions.ts` and `src/app/(superadmin)/superadmin-portal/actions.ts` re-checks role server-side before mutating
- API: `src/app/api/auth/superadmin-add-user/route.ts` returns 403 if caller is not superadmin

### 3.3 `requireSubscriptionTier(required, currentPath)`

Defined in `src/lib/auth/requireSubscriptionTier.ts`:

```ts
export async function requireSubscriptionTier(
  required: SubscriptionTier,
  currentPath: string
): Promise<User> {
  const user = await userService.getCurrentUser();

  if (!user) {
    redirect(`/auth?next=${encodeURIComponent(currentPath)}`);
  }

  if (!meetsTier(user.subscription.tier, required)) {
    redirect(`/pricing?next=${encodeURIComponent(currentPath)}`);
  }

  return user;
}
```

Usage in tier-gated pages (e.g. `src/app/(members)/members-portal/pro/page.tsx`):

```ts
export default async function ProPage() {
  const user = await requireSubscriptionTier('pro', '/members-portal/pro');
  return <ProContentPage user={user} />;
}
```

**The `?next=` redirect chain:** if a free user lands on `/members-portal/pro`, they get redirected to `/pricing?next=/members-portal/pro`. After they subscribe and the success page polls until `tier !== 'free'`, the success page navigates to the original `next` path.

### How the three compose

```
Request /members-portal/pro
  ├── Layout (members)/layout.tsx     → requires authenticated user
  │     └── No role check (tier-gated, not role-gated)
  └── Page page.tsx
        └── requireSubscriptionTier('pro', '/members-portal/pro')
              ├── userService.getCurrentUser()  ← auth check
              └── meetsTier(user.subscription.tier, 'pro')  ← tier check

Request /admin-portal/add-member
  ├── Layout (admin)/layout.tsx       → requires authenticated user + role ∈ {admin, superadmin}
  └── Page page.tsx                   → renders form
        └── (Form submit calls server action that re-checks role)
```

---

## 4. Stripe Object Model

The four Stripe entities the app touches:

```
Product (Stripe Dashboard)
   │
   │ "StarkReads Starter / Pro / Enterprise"
   │
   ▼
Price (Stripe Dashboard) — has id like price_xxx
   │
   │ Recurring, monthly, USD
   │
   ▼
Customer (created on first checkout via stripe.customers.create)
   │
   │ One per user (stored as stripe_customer_id in subscriptions)
   │
   ▼
Subscription (created via Checkout Session)
   │
   │ status: incomplete → active → (canceled | past_due | …)
   │ items: [{ id, price: { id: "price_xxx" }, current_period_start, current_period_end }]
   │
   └─→ events: customer.subscription.updated / .deleted on changes
```

**Quirk worth knowing (Stripe SDK v22+):**
The `current_period_start` and `current_period_end` fields **moved from the Subscription object to each SubscriptionItem**. So:

```ts
// WRONG (pre-v22, breaks at runtime in v22):
new Date(subscription.current_period_start * 1000)

// CORRECT (v22+):
new Date(subscription.items.data[0].current_period_start * 1000)
```

The webhook handler reflects this:

```ts
const firstItem = subscription.items.data[0];
current_period_start: firstItem ? new Date(firstItem.current_period_start * 1000).toISOString() : null,
current_period_end:   firstItem ? new Date(firstItem.current_period_end * 1000).toISOString() : null,
```

---

## 5. Price ID ↔ Tier Resolution (the `tierResolver`)

Stripe knows about Price IDs (`price_xxx`); the app knows about tiers (`'pro'`). The bridge is `src/lib/stripe/tierResolver.ts`:

```ts
import type { SubscriptionTier } from '@/types/subscription';

const PRICE_TO_TIER: Record<string, SubscriptionTier> = {
  [process.env.STRIPE_PRICE_STARTER!]: 'starter',
  [process.env.STRIPE_PRICE_PRO!]: 'pro',
  [process.env.STRIPE_PRICE_ENTERPRISE!]: 'enterprise',
};

export function resolveTierFromPriceId(priceId: string): SubscriptionTier | null {
  return PRICE_TO_TIER[priceId] ?? null;
}

export function resolvePriceIdFromTier(tier: SubscriptionTier): string | null {
  const entry = Object.entries(PRICE_TO_TIER).find(([, t]) => t === tier);
  return entry?.[0] ?? null;
}
```

**Critical detail:** the `PRICE_TO_TIER` record is **built at module-load time** from `process.env`. This means:
1. Env vars must be set before the module imports (`STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ENTERPRISE`)
2. Tests that import `tierResolver` directly must set those env vars **before** the import statement (see `src/__tests__/lib/pure-functions.test.ts` for the pattern)
3. Integration tests sidestep this by mocking the resolver (`jest.mock('@/lib/stripe/tierResolver', ...)`)

### Adding a new tier

To add a new tier (say, `team`):

1. Add to `SubscriptionTier` and `TIER_LEVELS` in `src/types/subscription.ts`
2. Add `STRIPE_PRICE_TEAM` to `.env.local` and Secret Manager
3. Add to `PRICE_TO_TIER` in `tierResolver.ts`
4. Add `team` to the `tier` CHECK constraint on `public.subscriptions`
5. Add a `Plan` to the `PLANS` array in `src/services/subscriptionService.ts`
6. Add to the VALID_TIERS array in `src/app/api/checkout/route.ts`
7. Run tests, smoke-test checkout

See `docs/DEVELOPMENT_GUIDE.md § "Add a new tier"` for the full recipe.

---

## 6. Checkout Flow (Step by Step)

The checkout route (`src/app/api/checkout/route.ts`) handles **two flows in one endpoint**: first-time subscribe, and tier upgrade.

### 6.1 First-time subscriber

```
1. Authenticate user (createClient → auth.getUser)
   └── 401 if not authenticated

2. Validate body.tier ∈ {starter, pro, enterprise}
   └── 400 if invalid

3. Validate body.next via safeRedirect()
   └── Becomes null if unsafe; passed through encoded if valid

4. Resolve tier → priceId via resolvePriceIdFromTier()
   └── 400 if not configured (env var missing)

5. Look up subscriptions row WHERE user_id = X
   └── No row found → first-time path

6. Create Stripe Customer
   stripe.customers.create({
     email: user.email,
     metadata: { supabase_user_id: user.id }
   })
   → returns cus_xxx

7. UPSERT placeholder subscriptions row
   { user_id, stripe_customer_id, tier, status: 'incomplete' }

8. Create Stripe Checkout Session
   stripe.checkout.sessions.create({
     mode: 'subscription',
     customer: cus_xxx,
     line_items: [{ price: priceId, quantity: 1 }],
     success_url: <origin>/subscribe/success[?next=…],
     cancel_url:  <origin>/pricing[?next=…],
     metadata: { supabase_user_id: user.id, tier }
   })

9. Return { redirect_url: session.url }
   ⇒ Browser navigates to https://checkout.stripe.com/c/pay/cs_test_…
```

### 6.2 Existing active subscriber (upgrade or downgrade)

```
1-4. Same as above

5. Look up subscriptions row WHERE user_id = X
   └── Row found, stripe_subscription_id present, status === 'active'
       → upgrade path (skip Checkout Session entirely)

6. Retrieve full subscription from Stripe
   stripe.subscriptions.retrieve(stripe_subscription_id)
   → existingSub.items.data[0].id  ← the SubscriptionItem ID

7. Update the subscription's price
   stripe.subscriptions.update(stripe_subscription_id, {
     items: [{ id: existingItemId, price: newPriceId }]
   })
   → Stripe handles proration server-side

8. Build internal redirect to /subscribe/success
   (no Stripe Checkout needed — payment method already on file)

9. Return { redirect_url: <origin>/subscribe/success[?next=…] }

10. Stripe fires customer.subscription.updated webhook → DB updates
```

The branching condition in the route:

```ts
if (existingRow?.stripe_subscription_id && existingRow.status === 'active') {
  // upgrade path
} else {
  // first-time path
}
```

**Why the status check matters:** a user who started checkout but never paid has `status: 'incomplete'`. They should get a fresh Checkout Session, not a `subscriptions.update()` call against an incomplete sub.

---

## 7. Webhook Handler (Step by Step)

`src/app/api/webhooks/stripe/route.ts` handles three event types and returns 200 for everything else.

### Pre-amble (every event)

```
1. body = await request.text()              ← raw body, NOT request.json()
2. signature = request.headers.get('stripe-signature')
   └── 400 if missing
3. event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
   └── 400 if signature verification fails
```

**Why raw body:** Stripe's signature scheme is `HMAC-SHA256(secret, t + "." + raw_body)`. If Next.js had parsed and re-stringified the JSON, the signature would no longer match. Reading via `request.text()` preserves the bytes.

### Event handlers

#### `checkout.session.completed`

Fires when a user completes the Stripe-hosted Checkout flow.

```
1. session = event.data.object
2. subscriptionId = session.subscription
   └── If missing, log + break
3. subscription = await stripe.subscriptions.retrieve(subscriptionId)
4. firstItem = subscription.items.data[0]
5. priceId = firstItem.price.id
6. tier = resolveTierFromPriceId(priceId)
   └── If null (unknown price), log + break
7. supabaseUserId = session.metadata.supabase_user_id
   └── If missing, log + break (this should never happen — we set it in checkout route)
8. customerId = session.customer
9. UPSERT subscriptions {
     user_id, stripe_customer_id, stripe_subscription_id,
     tier, status: subscription.status,
     current_period_start: ISO of firstItem.current_period_start,
     current_period_end:   ISO of firstItem.current_period_end,
     cancel_at_period_end
   } ON CONFLICT (user_id) DO UPDATE
```

#### `customer.subscription.updated`

Fires on tier changes, payment method changes, period rollovers — anything that mutates the Stripe Subscription object.

```
1. subscription = event.data.object
2. firstItem = subscription.items.data[0]
3. tier = resolveTierFromPriceId(firstItem.price.id)
4. UPDATE subscriptions SET
     tier, status: subscription.status,
     current_period_start, current_period_end,
     cancel_at_period_end
   WHERE stripe_subscription_id = subscription.id
```

#### `customer.subscription.deleted`

Fires on full cancellation (not period-end cancellation).

```
1. subscription = event.data.object
2. UPDATE subscriptions SET status = 'canceled'
   WHERE stripe_subscription_id = subscription.id
```

### Why "always return 200"

Stripe retries non-2xx responses with exponential backoff for **3 days**. If a per-event handler throws and we return 500, Stripe will keep replaying the event. The handler instead:
- Catches all errors per-event
- Logs them via `console.error`
- Returns 200 unconditionally (`return new Response('OK', { status: 200 })`)

**Trade-off:** silent failures. The handler must be reliable. The `webhook.test.ts` suite covers each event type and the signature paths.

### Idempotency

Webhooks are at-least-once. The handler is idempotent because:
- `UPSERT ON CONFLICT (user_id)` — replaying the same `checkout.session.completed` writes the same row twice with no duplication
- `UPDATE WHERE stripe_subscription_id = X` — also idempotent (no-op if state already matches)

---

## 8. Success-Page Polling Pattern

When a user finishes Checkout, Stripe redirects them to `/subscribe/success?next=…`. The webhook fires asynchronously — there's a few-second window where the success page renders **before** the `subscriptions` row has been written.

The success page handles this race window with **client-side polling**.

```
src/app/(members)/subscribe/success/SubscribeSuccessContent.tsx ("use client")

  Render state machine:
  ┌──────────────────────────────────────────────────────────────┐
  │ 1. polling — "Activating your subscription…"                  │
  │     interval: every ~1s, calls subscriptionService            │
  │     (via fetch to a route or via direct call if SSR-friendly) │
  │     → if user.subscription.tier !== 'free' → state = 'ready'  │
  │     → after N attempts (~10s) → state = 'timeout'             │
  ├──────────────────────────────────────────────────────────────┤
  │ 2. ready — "Welcome to <Tier>!"                                │
  │     → auto-navigate to ?next= path or /members-portal         │
  ├──────────────────────────────────────────────────────────────┤
  │ 3. timeout — "Still processing — refresh in a moment."        │
  │     → show retry button + link to /members-portal             │
  └──────────────────────────────────────────────────────────────┘
```

This pattern is documented in `agent_docs/CURRENT_APP/PHASE_2_BACKEND/UI_SPEC_PHASE2.md` and implemented in `SubscribeSuccessContent.tsx`. The key design points:
- Don't render the success state until the DB confirms it — the user might subscribe to Pro and immediately try to access `/members-portal/pro`, which would still see `tier: 'free'` and bounce them back to /pricing
- Show progress so the user doesn't think nothing is happening
- Cap the polling so we don't hammer the DB if a webhook fails entirely

---

## 9. Customer Portal Integration

`src/app/api/customer-portal/route.ts` creates a [Stripe Customer Portal](https://stripe.com/docs/customer-management) session and returns the URL.

```ts
const session = await stripe.billingPortal.sessions.create({
  customer: subRow.stripe_customer_id,
  return_url: `${origin}/members-portal/account`,
});
return NextResponse.json({ redirect_url: session.url });
```

What the user can do in the portal (Stripe-hosted, no app code):
- Update payment method
- Switch billing interval (if multiple intervals are configured)
- Cancel subscription (immediate or at period end)
- Download invoices
- Update billing address

When the user changes anything material, Stripe fires `customer.subscription.updated` (or `.deleted`) and the webhook handler syncs the change to Supabase.

**Wired up in:** `src/app/(members)/members-portal/account/AccountPageContent.tsx` — the "Manage Subscription" button posts to `/api/customer-portal` and `window.location.href = redirect_url`.

---

## 10. The Double-Subscription Bug & Fix

### The bug

Originally, `/api/checkout` always called `stripe.checkout.sessions.create()` regardless of whether the user already had an active subscription. Result: a Pro user clicking "Upgrade to Enterprise" would end up with **two active Stripe subscriptions** — Pro and Enterprise — and double billing.

### The fix (2026-04-29)

Detect existing active subscription before creating a Checkout Session. If found, call `stripe.subscriptions.update()` to swap the price on the existing sub instead. Stripe handles proration. No new Checkout Session is created. The user is redirected straight to `/subscribe/success`.

Code (in `src/app/api/checkout/route.ts`):

```ts
if (existingRow?.stripe_subscription_id && existingRow.status === 'active') {
  const existingSub = await stripe.subscriptions.retrieve(existingRow.stripe_subscription_id);
  const existingItemId = existingSub.items.data[0]?.id;

  if (!existingItemId) {
    return NextResponse.json({ error: 'Could not find subscription item' }, { status: 500 });
  }

  await stripe.subscriptions.update(existingRow.stripe_subscription_id, {
    items: [{ id: existingItemId, price: priceId }],
  });

  const origin = new URL(request.url).origin;
  const successUrl = validatedNext
    ? `${origin}/subscribe/success?next=${encodeURIComponent(validatedNext)}`
    : `${origin}/subscribe/success`;

  return NextResponse.json({ redirect_url: successUrl });
}
// else fall through to first-time Checkout Session path
```

Tested via:
- `src/__tests__/api/checkout.test.ts` — "updates existing subscription (no new Checkout) when user already has an active sub"
- E2E (manual flow) — verified by walking the upgrade path against Stripe Sandbox

---

## 11. What's Deferred to Phase 3

| Capability | Why deferred | Notes |
|------------|--------------|-------|
| **Dunning / failed payment recovery** | Phase 2 scope is happy-path | Stripe sends `invoice.payment_failed` events; would need handler + email notification |
| **Trials** | Not in current pricing model | Add `trial_period_days` to `checkout.sessions.create` and handle `customer.subscription.trial_will_end` |
| **Annual billing** | Pricing page has only monthly cards | Create annual Prices in Stripe, add toggle to PlanCard, extend tier resolver to return both intervals |
| **Coupons / promo codes** | Out of scope | Add `discounts` and `allow_promotion_codes` to Checkout Session |
| **Multi-tenant / team plans** | Single-user subscriptions only | Would require an `organizations` table and `subscription.organization_id` |
| **Article CMS** | Articles still hardcoded in `articleService.ts` | Future: pull from Supabase or external CMS |
| **Email notifications** | Not implemented | Would integrate Resend / SendGrid on key webhook events |
| **Refunds UI** | Stripe Customer Portal handles this; no app-side flow | Could add admin-side refund tooling if needed |
| **Usage-based billing** | All plans are flat-rate | Would integrate Stripe metered billing |
| **Webhook delivery monitoring** | No alerting on webhook failures | Future: log failed events to a `webhook_events` table; alert on backlog |

---

## See Also

- `docs/ARCHITECTURE.md` — overall system architecture
- `docs/API_REFERENCE.md` — full request/response shapes for `/api/checkout`, `/api/webhooks/stripe`, `/api/customer-portal`
- `docs/DATABASE_SCHEMA.md` — `subscriptions` table definition
- `docs/TESTING.md` — how the subscription system is tested at every layer
- `docs/DEVELOPMENT_GUIDE.md` — recipes for adding tiers, gated pages, etc.
