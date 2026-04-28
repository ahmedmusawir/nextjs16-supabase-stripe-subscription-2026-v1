# DATA_CONTRACT: StarkReads — Phase 2 (Backend Integration)

> **Version:** 2.0
> **Date:** 2026-04-26
> **Status:** APPROVED
> **Inherits From:** DATA_CONTRACT v1.0 (types unchanged), APP_BRIEF Phase 2
> **Author:** Architect (Claude) for Tony Stark

---

## Purpose

This document defines the **real backend data shapes, API route contracts, and service layer swap specifications** for Phase 2. Types from DATA_CONTRACT v1.0 remain unchanged — this doc specifies what changes UNDER the hood.

---

## 1. Types — No Changes

All types from DATA_CONTRACT v1.0 carry forward unchanged:

- `SubscriptionTier` — `'free' | 'starter' | 'pro' | 'enterprise'`
- `TIER_LEVELS` — `{ free: 0, starter: 1, pro: 2, enterprise: 3 }`
- `Subscription` — `{ tier, status, renewal_date, started_at }`
- `Plan` — `{ id, tier, name, price_monthly, description, features, highlighted }`
- `Article` — `{ id, slug, title, excerpt, required_tier, content_preview, content_full, published_at, author }`
- `User` — `{ id, email, role, subscription }`

**No UI code changes.** Components consume the same shapes.

---

## 2. Supabase `subscriptions` Table Schema

**Already created manually.** Documented here for Claude Code's reference.

```sql
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('starter', 'pro', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Constraints
UNIQUE (user_id)
UNIQUE (stripe_subscription_id)

-- Indexes
idx_subscriptions_user_id ON (user_id)
idx_subscriptions_stripe_sub_id ON (stripe_subscription_id)

-- RLS
Users can SELECT own row (auth.uid() = user_id)
No direct INSERT/UPDATE/DELETE (service role only)

-- Trigger
updated_at auto-updates on every UPDATE
```

**Claude Code does NOT run this migration — it's already done.** This section is reference only.

---

## 3. Supabase Client Strategy

Two Supabase clients, used for different purposes:

**User Client (existing, respects RLS):**
```typescript
// Already exists in starter kit — use as-is
import { createClient } from '@/lib/supabase/server';  // or however starter kit exports it
// Uses NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY + user session cookie
// RLS enforced — user sees only their own subscription row
```

**Admin Client (new, bypasses RLS):**
```typescript
// Used ONLY in webhook handler and checkout route
// Create in: src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
```

**Critical:** The admin client MUST ONLY be imported in server-side files (`route.ts` handlers, server-side service methods). Never in components. Never in client-side code.

---

## 4. Tier Resolution Helper

```typescript
// src/lib/stripe/tierResolver.ts

import type { SubscriptionTier } from '@/types/subscription';

const PRICE_TO_TIER: Record<string, SubscriptionTier> = {
  [process.env.STRIPE_PRICE_STARTER!]: 'starter',
  [process.env.STRIPE_PRICE_PRO!]: 'pro',
  [process.env.STRIPE_PRICE_ENTERPRISE!]: 'enterprise',
};

/**
 * Maps a Stripe Price ID to our SubscriptionTier.
 * Returns null if Price ID is not recognized.
 */
export function resolveTierFromPriceId(priceId: string): SubscriptionTier | null {
  return PRICE_TO_TIER[priceId] ?? null;
}

/**
 * Maps a SubscriptionTier to a Stripe Price ID.
 * Used by checkout route to create the right Checkout Session.
 */
export function resolvePriceIdFromTier(tier: SubscriptionTier): string | null {
  const entry = Object.entries(PRICE_TO_TIER).find(([, t]) => t === tier);
  return entry?.[0] ?? null;
}
```

---

## 5. API Route Contracts

### 5.1 POST `/api/checkout`

**Purpose:** Create a Stripe Checkout Session for the requested tier.

**Request:**
```typescript
{
  tier: 'starter' | 'pro' | 'enterprise';  // required
  next?: string;                             // optional, validated via safeRedirect()
}
```

**Response (200):**
```typescript
{
  redirect_url: string;  // Stripe Checkout hosted URL (https://checkout.stripe.com/...)
}
```

**Error responses:**
- 401 — not authenticated
- 400 — invalid tier or missing tier
- 500 — Stripe API error

**Server-side logic:**
1. Authenticate user from Supabase session cookie
2. Validate `tier` is one of `starter | pro | enterprise`
3. Validate `next` via `safeRedirect()` if present
4. Look up existing `stripe_customer_id` from `subscriptions` table (using admin client)
5. If no customer: `stripe.customers.create({ email, metadata: { supabase_user_id } })`
6. If no subscription row exists yet: INSERT a placeholder row with `stripe_customer_id` and `status: 'incomplete'`
7. If subscription row exists but no `stripe_customer_id`: UPDATE with new customer ID
8. Resolve `tier` → Price ID via `resolvePriceIdFromTier()`
9. Create Checkout Session:
   ```typescript
   stripe.checkout.sessions.create({
     mode: 'subscription',
     customer: stripeCustomerId,
     line_items: [{ price: priceId, quantity: 1 }],
     success_url: `${origin}/subscribe/success${next ? `?next=${encodeURIComponent(next)}` : ''}`,
     cancel_url: `${origin}/pricing${next ? `?next=${encodeURIComponent(next)}` : ''}`,
     metadata: { supabase_user_id: user.id, tier },
   })
   ```
10. Return `{ redirect_url: session.url }`

---

### 5.2 POST `/api/webhooks/stripe`

**Purpose:** Receive and process Stripe webhook events.

**Request:** Raw body from Stripe (NOT parsed JSON — signature verification needs raw bytes).

**Response:** Always 200 (even for unknown events — Stripe retries on non-2xx).

**Critical implementation detail:** Next.js App Router API routes parse the body as JSON by default. The webhook handler MUST read the raw body for signature verification. Use:

```typescript
export async function POST(request: Request) {
  const body = await request.text();  // raw body, NOT request.json()
  const signature = request.headers.get('stripe-signature')!;
  
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 });
  }
  
  // Process event...
  return new Response('OK', { status: 200 });
}
```

**Event handling logic:**

```
checkout.session.completed:
  1. Extract session.subscription (Stripe Subscription ID)
  2. Retrieve full subscription object: stripe.subscriptions.retrieve(subscriptionId)
  3. Extract price ID from subscription.items.data[0].price.id
  4. Resolve tier via resolveTierFromPriceId()
  5. Extract customer ID from session.customer
  6. Extract supabase_user_id from session.metadata
  7. UPSERT into subscriptions table:
     - user_id, stripe_customer_id, stripe_subscription_id
     - tier, status: subscription.status
     - current_period_start, current_period_end (from subscription)
     - cancel_at_period_end: subscription.cancel_at_period_end

customer.subscription.updated:
  1. Extract subscription object from event.data.object
  2. Extract price ID → resolve tier
  3. UPDATE subscriptions table WHERE stripe_subscription_id matches:
     - tier, status, current_period_start, current_period_end, cancel_at_period_end

customer.subscription.deleted:
  1. Extract subscription object from event.data.object
  2. UPDATE subscriptions table WHERE stripe_subscription_id matches:
     - status: 'canceled'
```

**All other event types:** Log `event.type` for debugging, return 200, do nothing.

---

### 5.3 POST `/api/customer-portal`

**Purpose:** Create a Stripe Customer Portal session for subscription management.

**Request:**
```typescript
{}  // no body needed — user identified from session
```

**Response (200):**
```typescript
{
  redirect_url: string;  // Stripe Customer Portal URL
}
```

**Error responses:**
- 401 — not authenticated
- 404 — no subscription / no stripe_customer_id
- 500 — Stripe API error

**Server-side logic:**
1. Authenticate user from session
2. Look up `stripe_customer_id` from `subscriptions` table
3. If not found: return 404
4. Create portal session:
   ```typescript
   stripe.billingPortal.sessions.create({
     customer: stripeCustomerId,
     return_url: `${origin}/members-portal/account`,
   })
   ```
5. Return `{ redirect_url: session.url }`

---

## 6. Service Layer Swap Specifications

### 6.1 subscriptionService — What Changes

**`getCurrentSubscription()`**
- WAS: reads `dev_mock_tier` cookie / Zustand store → builds mock Subscription
- NOW: queries Supabase `subscriptions` table WHERE `user_id = current user`
- If no row found: returns `{ tier: 'free', status: 'none', renewal_date: null, started_at: null }`
- If row found: maps DB columns to Subscription type:
  - `tier` → `tier`
  - `status` → `status` (but map to 'none' if status is 'canceled' and period ended)
  - `current_period_end` → `renewal_date` (ISO string)
  - `created_at` → `started_at` (ISO string)

**`getPlans()`**
- WAS: returns `mockPlans`
- NOW: returns the same hardcoded plan data (plans don't live in DB — they're static config)
- Phase 2 note: plans are still defined in code, not fetched from Stripe. This is intentional — the pricing page layout depends on features and descriptions we control, not Stripe metadata.

**`subscribe(tier)`**
- WAS: flips cookie + Zustand store, returns `{ redirect_url: '/subscribe/success' }`
- NOW: POSTs to `/api/checkout` with `{ tier }`, returns `{ redirect_url }` (which is the Stripe Checkout URL)
- Signature unchanged: `async (tier) => Promise<{ redirect_url: string }>`

**`hasAccess(current, required)`**
- NO CHANGE: pure function using `meetsTier()`, no backend dependency

### 6.2 userService — What Changes

**`getCurrentUser()`**
- WAS: returns mock user with subscription from dev store/cookie
- NOW: 
  1. Gets authenticated user from Supabase Auth (existing)
  2. Gets role from `user_roles` table (existing)
  3. Gets subscription from `subscriptions` table (NEW query)
  4. If no subscription row: defaults to `{ tier: 'free', status: 'none', ... }`
  5. Joins all three into the `User` type and returns
- Signature unchanged: `async () => Promise<User | null>`

### 6.3 articleService — What Changes

**NO CHANGES.** Articles are still mock data in Phase 2 (they would come from a CMS in production, which is out of scope). Article service stays as-is.

---

## 7. Gate Helper Swap

**`requireSubscriptionTier(tier, currentPath)`**
- WAS: calls `userService.getCurrentUser()` which read from cookie
- NOW: calls `userService.getCurrentUser()` which queries Supabase
- Signature: UNCHANGED
- Logic: UNCHANGED (still uses `meetsTier()`)
- The swap is fully absorbed by `userService` — the gate helper doesn't know or care that the data source changed

---

## 8. Webhook Idempotency Strategy

**Approach:** Use Supabase UPSERT with `stripe_subscription_id` as the conflict key.

```typescript
// In checkout.session.completed handler:
const { error } = await supabaseAdmin
  .from('subscriptions')
  .upsert({
    user_id: supabaseUserId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    tier,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
  }, {
    onConflict: 'stripe_subscription_id',
  });
```

If the same webhook fires twice with the same `stripe_subscription_id`, the UPSERT updates the existing row instead of creating a duplicate. Same final state either way. Idempotent by design.

---

## 9. Stripe SDK Initialization

```typescript
// src/lib/stripe/stripe.ts

import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',  // use latest stable API version
  typescript: true,
});
```

**Note on API version:** Use whatever version Stripe SDK defaults to. The version string above is illustrative — Claude Code should use the SDK's default or the latest stable version at build time.

**This file is server-only.** Never imported in client components.

---

## 10. Deleted Files (Mock Cleanup)

After all swaps are complete and tested:

```
DELETE: src/mocks/                          (entire folder)
DELETE: src/store/useDevSubscriptionStore.ts
DELETE: src/components/dev/DevTierToggle.tsx
DELETE: src/components/dev/                 (entire folder if empty)

REMOVE from src/app/layout.tsx:
  - DevTierToggle import
  - DevTierToggle mount
  - process.env.NODE_ENV check wrapper

CLEAR: dev_mock_tier cookie (remove any code that reads/writes it)
```

**Verify after deletion:** `grep -r "mocks\|DevTierToggle\|dev_mock_tier\|useDevSubscription" src/` returns zero results.

---

## 11. Sign-Off Checklist

- [ ] Supabase table schema documented (reference only — already created)
- [ ] Both Supabase client strategies defined (user client vs admin client)
- [ ] Tier resolution helper specified (Price ID ↔ tier mapping)
- [ ] All 3 API route contracts defined (checkout, webhook, customer-portal)
- [ ] Service layer swap fully specified (what changes, what doesn't)
- [ ] Webhook idempotency strategy documented (UPSERT on conflict)
- [ ] Mock cleanup checklist defined
- [ ] Tony signs off

---

**END OF DATA_CONTRACT Phase 2**
