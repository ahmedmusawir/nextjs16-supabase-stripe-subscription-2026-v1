# API REFERENCE

> **Routes documented:** all 3 Stripe routes + brief notes on auth routes.
> **All routes are App Router `route.ts` handlers under `src/app/api/`.**
> **Last reviewed:** 2026-05-03

---

## Table of Contents

1. [POST `/api/checkout`](#1-post-apicheckout)
2. [POST `/api/webhooks/stripe`](#2-post-apiwebhooksstripe)
3. [POST `/api/customer-portal`](#3-post-apicustomer-portal)
4. [Auth Routes (Reference)](#4-auth-routes-reference)
5. [Common Conventions](#5-common-conventions)

---

## 1. POST `/api/checkout`

Creates a Stripe Checkout Session for a first-time subscriber, OR updates an existing active subscription's price (upgrade/downgrade).

**File:** `src/app/api/checkout/route.ts`
**Auth:** Required (Supabase session cookie)
**Branching:** see flow diagram below

### Request

```ts
POST /api/checkout
Content-Type: application/json

{
  "tier": "starter" | "pro" | "enterprise",   // required
  "next": "/articles/some-slug"                // optional — internal path for post-checkout redirect chain
}
```

### Response (200)

```ts
{
  "redirect_url": string  // Either a Stripe Checkout URL or an internal /subscribe/success URL
}
```

The browser is expected to `window.location.href = redirect_url` immediately.

### Error responses

| Status | Body | Cause |
|--------|------|-------|
| 401 | `{ "error": "Not authenticated" }` | No Supabase session cookie / expired session |
| 400 | `{ "error": "Invalid tier" }` | `tier` missing or not in `{starter, pro, enterprise}` |
| 400 | `{ "error": "Price not configured for tier" }` | `STRIPE_PRICE_<TIER>` env var unset |
| 500 | `{ "error": "Could not find subscription item" }` | Existing sub has no items array — should never happen with healthy Stripe data |
| 500 | `{ "error": "Failed to create checkout session" }` | Any other unhandled error (Stripe API issue, DB issue) |

### Flow

```
                ┌─────────────────────────────┐
                │ POST /api/checkout {tier}   │
                └──────────────┬──────────────┘
                               │
                ┌──────────────▼──────────────┐
                │ Auth check (Supabase user)  │── No → 401
                └──────────────┬──────────────┘
                               │ Yes
                ┌──────────────▼──────────────┐
                │ Validate tier ∈ valid set   │── No → 400
                └──────────────┬──────────────┘
                               │ Yes
                ┌──────────────▼──────────────┐
                │ Validate next via           │
                │ safeRedirect (or null)      │
                └──────────────┬──────────────┘
                               │
                ┌──────────────▼──────────────┐
                │ Resolve tier → priceId      │── null → 400
                └──────────────┬──────────────┘
                               │
                ┌──────────────▼──────────────────────────┐
                │ SELECT stripe_*, status FROM            │
                │  subscriptions WHERE user_id = X        │
                └──────────────┬──────────────────────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
              ▼                                 ▼
   has active sub?                       no active sub
   (sub_id present + status='active')           │
              │                                 │
              ▼                                 ▼
   ┌────────────────────┐         ┌──────────────────────────┐
   │ retrieve sub       │         │ if no stripe_customer_id:│
   │ get item.id        │         │   create Stripe Customer │
   │ subscriptions.update│         │   UPSERT row with        │
   │   (price swap)     │         │   {customer_id, tier,    │
   │                    │         │    status: 'incomplete'} │
   │ build internal     │         │                          │
   │ /subscribe/success │         │ checkout.sessions.create │
   │ URL                │         │   (mode: subscription,   │
   │                    │         │    customer, line_items, │
   │                    │         │    success/cancel URLs,  │
   │                    │         │    metadata: user+tier)  │
   └─────────┬──────────┘         └──────────┬───────────────┘
             │                                │
             ▼                                ▼
   { redirect_url: "/subscribe/success" }  { redirect_url: session.url }
```

### Example curl (first-time subscriber)

```bash
curl -X POST http://localhost:3000/api/checkout \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-access-token=…; sb-refresh-token=…' \
  -d '{"tier": "pro"}'

# Response:
# {"redirect_url":"https://checkout.stripe.com/c/pay/cs_test_b1L2…"}
```

### Example curl (upgrade)

Same call shape — the route detects the existing sub and chooses the upgrade branch automatically:

```bash
curl -X POST http://localhost:3000/api/checkout \
  -H 'Content-Type: application/json' \
  -H 'Cookie: sb-access-token=…' \
  -d '{"tier": "enterprise"}'

# Response:
# {"redirect_url":"http://localhost:3000/subscribe/success"}
```

### Side effects

| When | Effect |
|------|--------|
| First-time path | Creates Stripe Customer; creates `subscriptions` placeholder row with `status: 'incomplete'`; creates Stripe Checkout Session |
| Upgrade path | Calls `stripe.subscriptions.update` (Stripe handles proration); no DB write — webhook does the sync |

### Tested by

- `src/__tests__/api/checkout.test.ts` — 4 unit/integration tests covering: 401 path, 400 path, first-time success path, upgrade path
- E2E paywall flow (`e2e/paywall.spec.ts`) covers the upstream UX

### See also

- `docs/SUBSCRIPTION_SYSTEM.md § 6` — checkout flow walk-through
- `docs/SUBSCRIPTION_SYSTEM.md § 10` — the double-subscription bug fix history

---

## 2. POST `/api/webhooks/stripe`

Receives Stripe webhook events, verifies signature, and synchronizes `subscriptions` table state.

**File:** `src/app/api/webhooks/stripe/route.ts`
**Auth:** None (public endpoint, secured by signature verification)
**Idempotency:** Yes — UPSERT on conflict + UPDATE WHERE clauses

### Request

The body is a **raw Stripe event payload** (JSON-shaped, but consumed as raw text for signature verification).

```ts
POST /api/webhooks/stripe
Content-Type: application/json
stripe-signature: t=1700000000,v1=<hash>,v0=<hash>

<raw event JSON from Stripe>
```

### Response

| Scenario | Response |
|----------|----------|
| Missing `stripe-signature` header | `400` `"Missing stripe-signature header"` |
| Signature verification fails | `400` `"Webhook signature verification failed"` |
| Any successful processing OR per-event handler error | `200` `"OK"` |
| Unknown event type | `200` `"OK"` (logged, not errored) |

**Why always 200 on success/error:** Stripe retries non-2xx responses for up to 3 days. Per-event errors are caught, logged, and swallowed to prevent a perpetual retry storm. This is a deliberate design choice — see `docs/SUBSCRIPTION_SYSTEM.md § 7`.

### Events handled

| Event | Handler logic |
|-------|---------------|
| `checkout.session.completed` | Retrieve full subscription; UPSERT subscriptions row with all fields |
| `customer.subscription.updated` | UPDATE subscriptions row WHERE `stripe_subscription_id = X` with new tier, status, period dates |
| `customer.subscription.deleted` | UPDATE `status = 'canceled'` WHERE `stripe_subscription_id = X` |
| Anything else | `console.log("[webhook] Unhandled event type: …")`, return 200 |

### Critical implementation detail: raw body

Next.js's default body parser would JSON-parse the request, breaking signature verification. The handler reads the raw body explicitly:

```ts
const body = await request.text();          // RAW bytes — NOT request.json()
const signature = request.headers.get('stripe-signature');

let event: Stripe.Event;
event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET!
);
```

### The Stripe SDK v22 `current_period_*` gotcha

In Stripe SDK v22+, `current_period_start` and `current_period_end` moved from the Subscription object to each item in `subscription.items.data[*]`. The handler reads them from the item:

```ts
const firstItem = subscription.items.data[0];
current_period_start: firstItem
  ? new Date(firstItem.current_period_start * 1000).toISOString()
  : null,
current_period_end: firstItem
  ? new Date(firstItem.current_period_end * 1000).toISOString()
  : null,
```

### Idempotency

The route uses two patterns:

1. **UPSERT on `user_id`** for `checkout.session.completed`:
   ```ts
   .upsert({ user_id, ... }, { onConflict: 'user_id' })
   ```
   Replays of the same event write the same row — same final state.

2. **UPDATE WHERE** for the other two events:
   ```ts
   .update({ ... }).eq('stripe_subscription_id', subscription.id)
   ```
   Idempotent by construction (same WHERE + same SET = same end state).

### Example: triggering a webhook via Stripe CLI

```bash
# 1. Start the webhook forwarder (in one terminal)
./scripts/start_stripe_webhook.sh
# OR:
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 2. Trigger a test event (in another terminal)
stripe trigger checkout.session.completed
```

### Tested by

- `src/__tests__/api/webhook.test.ts` — 6 tests:
  - Missing signature → 400
  - Invalid signature → 400
  - `checkout.session.completed` → upsert with full row
  - `customer.subscription.updated` → update with new tier
  - `customer.subscription.deleted` → status: 'canceled'
  - Unknown event type → 200, no DB writes

### See also

- `docs/SUBSCRIPTION_SYSTEM.md § 7` — full webhook handler walk-through
- `docs/DEVELOPMENT_GUIDE.md` — "How to debug webhook issues"
- `docs/DEPLOYMENT.md` — webhook endpoint registration in production

---

## 3. POST `/api/customer-portal`

Creates a Stripe Customer Portal session for subscription management (update payment method, cancel, view invoices, etc.).

**File:** `src/app/api/customer-portal/route.ts`
**Auth:** Required (Supabase session cookie)
**Prerequisites:** User must have a `subscriptions` row with a non-null `stripe_customer_id`

### Request

```ts
POST /api/customer-portal
Content-Type: application/json
(no body required — user identified from session)
```

### Response (200)

```ts
{
  "redirect_url": string  // https://billing.stripe.com/p/session/<id>
}
```

The browser is expected to `window.location.href = redirect_url`.

### Error responses

| Status | Body | Cause |
|--------|------|-------|
| 401 | `{ "error": "Not authenticated" }` | No session cookie |
| 404 | `{ "error": "No subscription found" }` | No `subscriptions` row, OR row has no `stripe_customer_id` |
| 500 | `{ "error": "Failed to create portal session" }` | Stripe API issue |

### Flow

```
POST /api/customer-portal
  ├─→ Auth → 401 if not authenticated
  ├─→ SELECT stripe_customer_id FROM subscriptions WHERE user_id = X
  │     (admin client used here so we can read the row even though it would also be RLS-readable as the user)
  │     → 404 if row missing or stripe_customer_id null
  ├─→ stripe.billingPortal.sessions.create({
  │     customer: stripe_customer_id,
  │     return_url: <origin>/members-portal/account
  │   })
  └─→ return { redirect_url: session.url }
```

### Example curl

```bash
curl -X POST http://localhost:3000/api/customer-portal \
  -H 'Cookie: sb-access-token=…'

# Response:
# {"redirect_url":"https://billing.stripe.com/p/session/test_…"}
```

### Wired up in

- `src/app/(members)/members-portal/account/AccountPageContent.tsx` — "Manage Subscription" button. The handler calls `fetch('/api/customer-portal')`, then `window.location.href = redirect_url`.

### Tested by

- `src/__tests__/api/customer-portal.test.ts` — 3 tests: 401, 404 (no customer), 200 success

---

## 4. Auth Routes (Reference)

These routes are inherited from the RBAC starter kit and predate Phase 2. They handle authentication and user management.

### POST `/api/auth/signup`

**File:** `src/app/api/auth/signup/route.ts`
**Purpose:** User registration
**Body:** `{ email, password, name }`
**Response:** Sets Supabase session cookies; redirects per app logic

### POST `/api/auth/login`

**File:** `src/app/api/auth/login/route.ts`
**Purpose:** Email/password login
**Body:** `{ email, password }`
**Response:** `{ user, role }` plus Supabase session cookies

### POST `/api/auth/logout`

**File:** `src/app/api/auth/logout/route.ts`
**Purpose:** Logout (clears Supabase session)
**Body:** None
**Response:** Cleared cookies; the client typically redirects to `/`

### GET `/api/auth/confirm`

**File:** `src/app/api/auth/confirm/route.ts`
**Purpose:** Email confirmation callback after Supabase sends a magic link
**Query:** `token_hash`, `type`, `next`
**Response:** Redirect to `next` after confirming

### POST `/api/auth/superadmin-add-user`

**File:** `src/app/api/auth/superadmin-add-user/route.ts`
**Purpose:** Superadmin endpoint to programmatically create a user with a chosen role
**Auth:** Superadmin role required (re-checked server-side)
**Body:** `{ email, password, role: 'admin' | 'member' }`
**Response:** `{ data: { user: { id } } }` on success
**Errors:**
- 401 if not authenticated
- 403 if caller is not superadmin
- 400 if required fields missing

Tested by `src/__tests__/superadmin-add-user.test.ts`.

---

## 5. Common Conventions

### URL pattern

All API routes live under `src/app/api/<segments>/route.ts`. Each `route.ts` exports HTTP method handlers as named functions:

```ts
export async function POST(request: Request) { ... }
export async function GET(request: Request) { ... }
```

### Error response shape

JSON responses use `{ error: string }` for failures:

```ts
return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
```

### Origin derivation

Routes that need to build URLs (e.g. `success_url`) derive the origin from the request:

```ts
const origin = new URL(request.url).origin;  // 'http://localhost:3000' in dev
```

### Auth pattern

Every authenticated route uses the same opening:

```ts
const supabase = await createClient();           // Supabase user client
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
}
```

### Admin client usage

When a route needs to read/write across users (webhooks, checkout looking up sub state), it uses the admin client:

```ts
const supabaseAdmin = createAdminClient();
const { data } = await supabaseAdmin.from('subscriptions').select(...);
```

The admin client is **server-only** (see `docs/ARCHITECTURE.md § 8`).

### Safe redirect

The optional `next` param on checkout uses `safeRedirect()` to prevent open-redirect attacks:

```ts
const validatedNext = next ? safeRedirect(next) : null;
```

`safeRedirect()` rejects: protocol-relative URLs (`//evil.com`), schemed URLs (`https://...`), backslashes, anything not starting with `/`. Defined in `src/lib/safeRedirect.ts`. Tested in `src/__tests__/lib/pure-functions.test.ts`.

---

## See Also

- `docs/SUBSCRIPTION_SYSTEM.md` — the application logic these routes implement
- `docs/DATABASE_SCHEMA.md` — the tables these routes read/write
- `docs/TESTING.md` — how each route is tested at unit and integration levels
- `docs/DEPLOYMENT.md` — registering the webhook URL in Stripe Dashboard for production
