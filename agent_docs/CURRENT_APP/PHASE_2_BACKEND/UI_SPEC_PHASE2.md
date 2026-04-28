# UI_SPEC: StarkReads — Phase 2 (Backend Integration)

> **Version:** 2.0
> **Date:** 2026-04-26
> **Status:** APPROVED
> **Inherits From:** UI_SPEC v1.1, APP_BRIEF Phase 2
> **Author:** Architect (Claude) for Tony Stark

---

## Purpose

Phase 2 is a backend swap — most UI stays untouched. This doc specifies the **small set of frontend behavior changes** needed to support real Stripe integration.

---

## 1. Changes Summary

Only 3 UI behaviors change. Everything else is identical to Phase 1.

| Component/Page | What Changes | Why |
|----------------|-------------|-----|
| PlanCard | `subscribe()` now returns a Stripe URL → full page redirect instead of `router.push()` | Stripe Checkout is an external URL, not an internal route |
| Subscribe Success Page | Add polling for subscription status | Webhook may arrive after browser redirect |
| Account Page | "Manage Subscription" button wired to real Stripe Customer Portal | Replaces "Coming soon" toast |

---

## 2. PlanCard — Redirect Change

**File:** `src/components/subscriptions/PlanCard.tsx`

**What was (Phase 1):**
```typescript
const result = await subscriptionService.subscribe(plan.tier);
router.push(result.redirect_url);  // internal route: /subscribe/success
```

**What it becomes (Phase 2):**
```typescript
const result = await subscriptionService.subscribe(plan.tier);
// redirect_url is now an external Stripe URL (https://checkout.stripe.com/...)
// router.push() doesn't work for external URLs — use window.location
window.location.href = result.redirect_url;
```

**Why `window.location.href` instead of `router.push()`:** Next.js router only handles internal routes. Stripe Checkout lives on `checkout.stripe.com`. We need a full browser redirect, not a client-side navigation.

**Loading state during API call:** Keep the existing spinner on the Subscribe button. The delay between clicking and redirecting is the time to create the Checkout Session (~1-2 seconds). Button stays disabled with spinner until redirect happens.

**Error handling:** If the `/api/checkout` call fails, show a toast: "Couldn't start checkout. Please try again." Re-enable the button.

---

## 3. Subscribe Success Page — Polling Pattern

**File:** `src/app/(members)/subscribe/success/SubscribeSuccessContent.tsx`

**The problem:** User lands on this page via Stripe's `success_url` redirect. But the webhook that actually writes the subscription to Supabase may not have arrived yet. If we read the subscription immediately, it might still show "free."

**The solution:** Poll until the subscription appears, with graceful fallback.

**Behavior:**

```
Page loads → call subscriptionService.getCurrentSubscription()
  ↓
If tier !== 'free':
  → Show confirmation: "Welcome to {tier}!" (same as Phase 1)
  ↓
If tier === 'free' (webhook hasn't arrived yet):
  → Show loading state: spinner + "Activating your subscription..."
  → Poll every 2 seconds
  → Max 5 attempts (10 seconds total)
  ↓
If tier updates during polling:
  → Show confirmation
  ↓
If polling exhausts (still 'free' after 10 seconds):
  → Show: "Your payment was received! Your subscription will activate momentarily."
  → Button: "Refresh" (reloads the page)
  → Small text: "If this persists, check your email for confirmation from Stripe."
```

**Implementation notes:**
- This page needs to become a Client Component (`"use client"`) for the polling `useEffect`
- Use `useState` for: `currentTier`, `isPolling`, `pollCount`
- The `?next=` logic stays identical — "Continue" button still reads and validates `next` param

**Visual states (3 total):**

| State | Visual |
|-------|--------|
| **Polling** | Spinner icon (Lucide `Loader2` spinning) + "Activating your subscription..." text. No action buttons yet. |
| **Confirmed** | Green check icon + "Welcome to {tier}!" + Continue/Read Premium Articles button. Same as Phase 1. |
| **Timeout** | Amber info icon (Lucide `Info`) + "Payment received, activating momentarily..." + Refresh button. |

---

## 4. Account Page — Manage Subscription Button

**File:** `src/app/(members)/members-portal/account/AccountPageContent.tsx`

**What was (Phase 1):**
```typescript
<Button onClick={() => toast("Subscription management coming soon")}>
  Manage Subscription
</Button>
```

**What it becomes (Phase 2):**
```typescript
const handleManageSubscription = async () => {
  setIsLoading(true);
  try {
    const response = await fetch('/api/customer-portal', { method: 'POST' });
    const data = await response.json();
    if (data.redirect_url) {
      window.location.href = data.redirect_url;  // external Stripe URL
    }
  } catch {
    toast.error("Couldn't open subscription management. Please try again.");
  } finally {
    setIsLoading(false);
  }
};
```

**Button shows spinner while loading.** Same pattern as PlanCard.

**Only visible when `tier !== 'free'`** (same condition as Phase 1 — free users see "Subscribe" instead).

---

## 5. DevTierToggle — Removed

**File:** `src/components/dev/DevTierToggle.tsx` → DELETED

**Mount in `src/app/layout.tsx`** → REMOVED (the conditional render + import)

No replacement needed. The dev widget's job was to simulate tier states. Real Stripe subscriptions now do that.

**For testing different tiers in development:** Register separate test users and subscribe each to a different tier using test card `4242 4242 4242 4242`. More realistic than a toggle and tests the actual checkout flow.

---

## 6. No Other UI Changes

These components/pages are UNTOUCHED in Phase 2:

- Home page
- Articles index
- Article detail + Paywall component
- Pricing page (PlanCard behavior changes, but pricing page layout is identical)
- TierBadge
- ArticleCard
- Navbar / NavbarHome
- Sidebar
- LoginForm / RegisterForm (the `?next=` plumbing stays)
- Tier-gated content pages (Starter/Pro/Enterprise)

---

## 7. Build Order (Phase 2)

```
Step 1:  Install stripe package
Step 2:  Create src/lib/stripe/stripe.ts (SDK init)
Step 3:  Create src/lib/stripe/tierResolver.ts
Step 4:  Create src/lib/supabase/admin.ts
Step 5:  Build /api/checkout/route.ts
Step 6:  Update subscriptionService.subscribe() to call /api/checkout

→ 🛑 GATE 1: Subscribe → real Stripe Checkout → redirected back.

Step 7:  Build /api/webhooks/stripe/route.ts
Step 8:  Update subscriptionService.getCurrentSubscription() to query Supabase
Step 9:  Update userService.getCurrentUser() to query subscriptions table
Step 10: Update requireSubscriptionTier() (remove cookie reads if any)
Step 11: Update SubscribeSuccessContent with polling pattern

→ 🛑 GATE 2: Full loop works. Subscribe → pay → webhook → DB row → content unlocks.

Step 12: Build /api/customer-portal/route.ts
Step 13: Update Account page Manage Subscription button
Step 14: Delete mock files, dev store, dev widget, layout mount
Step 15: Run grep verification (zero mock references)
Step 16: tsc --noEmit, npm test, npm run build
Step 17: Walk all 6 user flows with real Stripe

→ 🛑 GATE 3: Everything clean. Hand back to Tony.
```

---

## 8. Sign-Off Checklist

- [ ] PlanCard redirect change specified (window.location.href for external URL)
- [ ] Success page polling pattern fully defined (3 visual states, timing, fallback)
- [ ] Account page Manage Subscription button wired to Customer Portal
- [ ] DevTierToggle removal documented
- [ ] Build order with 3 gates defined
- [ ] Tony signs off

---

**END OF UI_SPEC Phase 2**
