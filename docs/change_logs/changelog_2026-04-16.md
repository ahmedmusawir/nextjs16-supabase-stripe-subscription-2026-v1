# Changelog — 2026-04-16

## Loading Spinners + Button Styling Polish

**Branch:** `step-1`
**Author:** Claude Code `[CC]`

---

### Fix: Missing Loading Spinners `[CC]`

**Problem:** Inconsistent loading states across routes — some pages showed spinners on sidebar navigation, others didn't. Only 5 of 20 routes had `loading.tsx` files.

**Fix:** Added `loading.tsx` to all 15 routes that were missing one. Each uses the existing `SpinnerLarge` component, centered with `min-h-[60vh]`.

**Files Created (15):**
- `src/app/(members)/members-portal/starter/loading.tsx`
- `src/app/(members)/members-portal/pro/loading.tsx`
- `src/app/(members)/members-portal/enterprise/loading.tsx`
- `src/app/(members)/members-portal/account/loading.tsx`
- `src/app/(members)/members-portal/profile/loading.tsx`
- `src/app/(members)/subscribe/success/loading.tsx`
- `src/app/(members)/booking/loading.tsx`
- `src/app/(public)/articles/loading.tsx`
- `src/app/(public)/articles/[slug]/loading.tsx`
- `src/app/(public)/pricing/loading.tsx`
- `src/app/(admin)/admin-booking/loading.tsx`
- `src/app/(admin)/profile/loading.tsx`
- `src/app/(auth)/auth/loading.tsx`
- `src/app/error/loading.tsx`
- `src/app/template/loading.tsx`

**Result:** 20/20 routes now have loading spinners.

---

### Enhancement: Button Styling Consistency `[CC]`

**Problem:** Buttons using the ShadCN `default` variant had no visible border — looked flat and unprofessional. Inconsistent styling across StarkReads pages.

**Fix:** Applied consistent violet-themed styling to all 11 buttons across 6 files:
- **Primary CTAs** — Solid `bg-violet-600` fill + `border-violet-700` border + white text
- **Secondary CTAs** — Outline with `border-violet-300` + violet text + subtle hover

**Files Modified (6):**
- `src/app/(public)/HomePageContent.tsx` — See Pricing, Browse Articles, View Plans
- `src/components/articles/Paywall.tsx` — Sign up / Upgrade CTA
- `src/components/subscriptions/PlanCard.tsx` — Subscribe buttons (highlighted + standard)
- `src/app/(members)/subscribe/success/SubscribeSuccessContent.tsx` — View Plans, Continue
- `src/app/(members)/members-portal/MembersPortalContent.tsx` — Upgrade to Pro
- `src/app/(members)/members-portal/account/AccountPageContent.tsx` — Subscribe, Manage, Change Plan

---

### Verification

| Check | Result |
|-------|--------|
| `tsc --noEmit` | Clean — 0 errors |
| `npm test` | 81/81 passed |
| Manual test (Tony) | Loading spinners confirmed on all page transitions |
| Manual test (Tony) | Button styling confirmed |
