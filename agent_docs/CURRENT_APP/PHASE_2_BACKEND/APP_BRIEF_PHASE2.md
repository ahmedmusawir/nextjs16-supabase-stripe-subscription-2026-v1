# APP_BRIEF: StarkReads — Phase 2 (Backend Integration)

> **Version:** 2.0
> **Date:** 2026-04-26
> **Status:** APPROVED
> **Phase:** Backend Integration (Stripe + Supabase)
> **Built On:** Phase 1 Frontend Prototype (complete, tested, signed off)
> **Author:** Architect (Claude) for Tony Stark

---

## 1. Hero Statement

Phase 2 replaces the mock subscription layer with **real Stripe payments and real Supabase subscription state.** When complete, a user can click Subscribe on the pricing page, pay with a real (test) credit card on Stripe's hosted Checkout, and have their subscription tier reflected in the app within seconds — gating content, updating the navbar badge, and persisting across sessions.

**What changes:** Service layer internals, two new API routes, mock infrastructure deleted.
**What does NOT change:** All pages, all components, all types, all gate helpers' signatures.

This is the payoff of frontend-first: the UI survives the backend swap untouched.

---

## 2. Scope — What We're Building

### In Scope (Happy Path Only)

| # | Task | Description |
|---|------|-------------|
| 1 | Checkout API route | `/api/checkout/route.ts` — creates Stripe Checkout Session, returns hosted URL |
| 2 | Webhook handler | `/api/webhooks/stripe/route.ts` — receives Stripe events, verifies signature, writes to Supabase |
| 3 | Service layer swap | Replace mock implementations with real Supabase queries + Stripe API calls |
| 4 | Gate helper swap | `requireSubscriptionTier()` reads from Supabase instead of cookie |
| 5 | Mock cleanup | Delete `src/mocks/`, dev store, dev widget, cookie logic |
| 6 | Stripe Customer Portal | Replace "Manage Subscription — Coming Soon" with real Stripe-hosted portal redirect |
| 7 | End-to-end testing | All 6 user flows verified with real Stripe Sandbox payments |

### Out of Scope (Deferred)

| Feature | Reason | Planned For |
|---------|--------|-------------|
| Payment failure handling (dunning) | Happy path only | Phase 3 |
| Trial periods | Not in v1 tier model | Phase 3 |
| Proration for mid-cycle tier changes | Stripe handles automatically; UI deferred | Phase 3 |
| Custom transactional emails | Lean on Stripe's built-in emails | Phase 3 |
| Reconciliation job (Stripe ↔ Supabase sync check) | Not needed for prototype | Phase 3 |
| Annual billing option | Monthly only in v1 | Phase 3 |
| Production deployment (Cloud Run) | Separate step after backend is proven | Step 15 |

---

## 3. Infrastructure (Already Complete)

All infrastructure was set up manually before this brief was written. Claude Code does NOT need to create any of this.

| Resource | Status | Details |
|----------|--------|---------|
| Stripe Sandbox | ✅ Ready | "StarkRead Nextjs Subscription v1" under The Moose account |
| Stripe Product | ✅ Ready | "StarkReads Subscription" — 1 product, 3 prices |
| Stripe CLI | ✅ Ready | Installed, logged in, listener forwarding to localhost:3000 |
| Supabase `subscriptions` table | ✅ Ready | 11 columns, 4 RLS policies, 2 indexes, auto-update trigger |
| Environment variables | ✅ Ready | All 6 Stripe vars + existing Supabase vars in `.env.local` |

**Environment variables available to the app:**

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY    # pk_test_... (safe for browser)
STRIPE_SECRET_KEY                      # sk_test_... (server-only, NEVER in browser)
STRIPE_PRICE_STARTER                   # price_... for $5/mo Starter
STRIPE_PRICE_PRO                       # price_... for $15/mo Pro
STRIPE_PRICE_ENTERPRISE                # price_... for $49/mo Enterprise
STRIPE_WEBHOOK_SECRET                  # whsec_... (server-only, for signature verification)
NEXT_PUBLIC_SUPABASE_URL               # (already exists from RBAC)
NEXT_PUBLIC_SUPABASE_ANON_KEY          # (already exists from RBAC)
SUPABASE_SERVICE_ROLE_KEY              # (already exists from RBAC, used by webhook handler)
```

**Claude Code must NEVER hardcode any of these values.** Always read from `process.env`.

---

## 4. Tech Stack Additions

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Stripe SDK** | `stripe` npm package | Server-side Stripe API calls (create customer, create checkout session, construct webhook event) |
| **Supabase Admin Client** | `@supabase/supabase-js` with service role key | Webhook handler writes (bypasses RLS) |
| **Supabase User Client** | `@supabase/supabase-js` with anon key + user session | Service layer reads (respects RLS — user sees own subscription only) |

**Install required:**
```bash
npm install stripe
```

`@supabase/supabase-js` is already installed from the RBAC starter kit.

---

## 5. Webhook Events (Happy Path Only)

The webhook handler processes these three event types. All others are logged and ignored.

| Event Type | When It Fires | What We Do |
|------------|---------------|------------|
| `checkout.session.completed` | User completes Stripe Checkout | Look up the Stripe Subscription from the session → extract tier from Price ID → INSERT row into `subscriptions` table (or UPDATE if exists) |
| `customer.subscription.updated` | Any subscription change (upgrade, downgrade, renewal, cancellation pending) | Read updated subscription object → UPDATE tier, status, period dates, cancel_at_period_end in `subscriptions` table |
| `customer.subscription.deleted` | Subscription fully canceled (period ended) | UPDATE status to 'canceled', tier stays for historical record |

**Idempotency:** Each webhook event has a unique `event.id`. Before processing, check if we've already handled this event ID. If yes, return 200 and skip. Prevents duplicate processing from Stripe's retry mechanism.

**Signature verification:** EVERY incoming webhook request MUST be verified using `stripe.webhooks.constructEvent()` with the `STRIPE_WEBHOOK_SECRET`. Unverified requests are rejected with 400. This is NON-NEGOTIABLE — without it, anyone can forge subscription activations.

---

## 6. Tier Resolution From Price ID

The webhook receives a Stripe Price ID. We need to map it to our tier string. This mapping lives in a single helper:

```
STRIPE_PRICE_STARTER  → 'starter'
STRIPE_PRICE_PRO      → 'pro'
STRIPE_PRICE_ENTERPRISE → 'enterprise'
```

Read from environment variables. Never hardcode Price IDs. Helper function: `resolveTierFromPriceId(priceId: string): SubscriptionTier | null`.

---

## 7. Stripe Customer ID Strategy

**When a user first subscribes:**
1. Check if user already has a `stripe_customer_id` in the `subscriptions` table
2. If not, create a new Stripe Customer via API (`stripe.customers.create({ email, metadata: { supabase_user_id } })`)
3. The `stripe_customer_id` is stored on the `subscriptions` row (not a separate table)

**Why on the subscriptions table:** Keeps the schema simple for v1. One table, one row per user, contains both Stripe Customer ID and subscription state. In Mothership (multi-tenant), this may split into a separate `organizations` or `customer_profiles` table. That refactor is explicitly deferred.

---

## 8. Checkout Flow (Detailed)

```
User clicks "Subscribe to Pro" on PlanCard
    ↓
PlanCard calls subscriptionService.subscribe('pro')
    ↓
subscriptionService POSTs to /api/checkout with { tier: 'pro' }
    ↓
/api/checkout route handler:
  1. Authenticates user (reads Supabase session from cookies)
  2. Checks for existing stripe_customer_id in subscriptions table
  3. If none: creates Stripe Customer, stores ID
  4. Maps tier → Price ID from env vars
  5. Creates Stripe Checkout Session:
     - mode: 'subscription'
     - customer: stripe_customer_id
     - line_items: [{ price: price_id, quantity: 1 }]
     - success_url: /subscribe/success?next={next_param}
     - cancel_url: /pricing
     - metadata: { supabase_user_id, tier }
  6. Returns { redirect_url: session.url }
    ↓
PlanCard receives URL → router.push(url)
    ↓
User lands on Stripe Checkout (hosted page)
    ↓
User enters test card 4242 4242 4242 4242
    ↓
Stripe processes payment → TWO things happen simultaneously:
  A. Browser redirected to /subscribe/success
  B. Webhook event fires → /api/webhooks/stripe
    ↓
Webhook handler verifies signature → writes subscription to Supabase
    ↓
Success page reads subscription from Supabase → shows tier confirmation
```

---

## 9. Success Page — Handling Webhook Delay

**The race condition:** The browser redirect (A) can arrive BEFORE the webhook (B) has written to Supabase. User lands on success page, but subscription isn't in the database yet.

**Solution:** The success page polls for subscription status:
1. On mount, check `subscriptionService.getCurrentSubscription()`
2. If tier is still 'free' (webhook hasn't arrived yet), show a loading state: "Activating your subscription..."
3. Poll every 2 seconds (max 5 attempts = 10 seconds)
4. When tier updates, show the confirmation
5. If polling exhausts (rare), show: "Your payment was received. Your subscription will activate momentarily." with a "Refresh" button

This is a UI change — documented in UI_SPEC Phase 2.

---

## 10. Customer Portal Integration

**Purpose:** Let subscribed users manage their subscription (cancel, update payment method, view invoices) without us building any management UI.

**Implementation:**
- New API route: `/api/customer-portal/route.ts`
- Takes user's `stripe_customer_id` from subscriptions table
- Creates a Stripe Billing Portal Session (`stripe.billingPortal.sessions.create()`)
- Returns the portal URL
- Frontend redirects to it

**UI change:** Account page "Manage Subscription" button goes from showing a "Coming soon" toast to redirecting to the real Stripe Customer Portal.

**Stripe Dashboard prerequisite:** Customer Portal must be activated in Stripe Dashboard → Settings → Billing → Customer Portal. Configure which actions customers can take (cancel, update payment). Claude Code cannot do this — Tony must configure it manually. Will be documented in deployment checklist.

---

## 11. "No Subscription" State

**The architectural decision:** In Phase 1 (mock), every user had a `Subscription` object with `tier: 'free'`. In Phase 2 (real), users who never subscribed have NO row in the `subscriptions` table.

**How we handle it:** The service layer treats "no row" as the free tier. `getCurrentSubscription()` queries Supabase; if no row is found, it returns the same `{ tier: 'free', status: 'none', renewal_date: null, started_at: null }` object as before.

**Why this matters:** Components and gate helpers receive the SAME Subscription type regardless of whether the user has a real subscription or not. No null checks in UI code. The service layer absorbs the complexity.

---

## 12. Build Gates (Sign-Off Checkpoints)

| Gate | What's Done | What Tony Verifies |
|------|-------------|--------------------|
| **Gate 1** | `stripe` package installed, checkout route built, service layer partially swapped (subscribe method calls real API) | Click Subscribe → lands on real Stripe Checkout → enter test card → redirected back to success page. Subscription NOT yet in DB (webhook not built). |
| **Gate 2** | Webhook handler built, service layer fully swapped, gate helper reads from Supabase | Full end-to-end: Subscribe → pay → webhook fires (visible in Stripe CLI terminal) → subscription row appears in Supabase → gated content unlocks. |
| **Gate 3** | Mocks deleted, Customer Portal wired, all 6 flows tested, build clean | Zero mock code remains. Customer Portal accessible from Account page. `tsc --noEmit` clean. `npm run build` clean. All existing tests pass. |

---

## 13. Security Checklist (Non-Negotiable)

- [ ] `STRIPE_SECRET_KEY` never imported in any client component
- [ ] `SUPABASE_SERVICE_ROLE_KEY` never imported in any client component
- [ ] Webhook signature verified on EVERY request via `stripe.webhooks.constructEvent()`
- [ ] Unverified webhook requests rejected with 400 status
- [ ] Checkout route authenticates user before creating session
- [ ] Price ID validated against known env var values before creating session
- [ ] `?next=` parameter validated via `safeRedirect()` in all redirects
- [ ] RLS prevents direct user writes to `subscriptions` table
- [ ] Stripe Customer creation includes `metadata.supabase_user_id` for traceability

---

## 14. Constraints

### Hard Constraints (Non-Negotiable)
- All existing pages and components remain UNTOUCHED (service layer swap only)
- Service method signatures (from DATA_CONTRACT v1.0) remain IDENTICAL
- Stripe secret key and Supabase service role key are server-only (never in client code)
- Webhook signature verification on every event (no exceptions)
- Happy path only — no payment failure, dunning, or trial handling
- `safeRedirect()` validation on all `?next=` parameters

### Soft Constraints
- Prefer Stripe's hosted solutions (Checkout, Customer Portal) over custom UI
- Minimize new dependencies (only `stripe` npm package added)
- Keep webhook handler focused — log-and-skip unknown event types

---

## 15. Success Criteria

**Phase 2 is successful when:**
- [ ] User can subscribe to any tier via real Stripe Checkout (test mode)
- [ ] Webhook handler receives events and writes correct subscription data to Supabase
- [ ] Gate helper reads subscription from Supabase and enforces cumulative tier hierarchy
- [ ] Success page handles webhook delay gracefully (polling pattern)
- [ ] Account page shows real subscription data from Supabase
- [ ] "Manage Subscription" button opens real Stripe Customer Portal
- [ ] Navbar badge reflects real subscription tier
- [ ] All mock infrastructure is deleted (mocks folder, dev store, dev widget, cookie logic)
- [ ] `?next=` chain works end-to-end through real Stripe Checkout and back
- [ ] All existing tests pass
- [ ] `tsc --noEmit` and `npm run build` both clean
- [ ] Tony can demo the full subscribe → pay → access flow to Coach

---

**END OF APP_BRIEF Phase 2**
