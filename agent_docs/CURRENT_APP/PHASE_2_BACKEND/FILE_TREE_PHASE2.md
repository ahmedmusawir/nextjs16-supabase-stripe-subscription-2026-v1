# FILE_TREE: StarkReads — Phase 2 (Backend Integration)

> **Version:** 2.0
> **Date:** 2026-04-26
> **Status:** APPROVED
> **Inherits From:** FILE_TREE v1.1, APP_BRIEF Phase 2, DATA_CONTRACT Phase 2
> **Author:** Architect (Claude) for Tony Stark

---

## Purpose

This document defines every file added, modified, or deleted in Phase 2. Short and surgical — Phase 2 touches far fewer files than Phase 1.

---

## 1. Legend

- 🆕 **NEW** — File created in Phase 2
- ✏️ **MODIFY** — Existing file, internals change (signatures stay)
- 🗑️ **DELETE** — Removed in Phase 2 cleanup
- 🔒 **UNTOUCHED** — Not modified in Phase 2

---

## 2. Full Tree (Changes Only)

```
src/
│
├── app/
│   ├── layout.tsx                                    ✏️ MODIFY  (remove DevTierToggle mount)
│   │
│   └── api/
│       ├── checkout/
│       │   └── route.ts                              🆕 NEW  (creates Stripe Checkout Session)
│       │
│       ├── webhooks/
│       │   └── stripe/
│       │       └── route.ts                          🆕 NEW  (receives + verifies Stripe events)
│       │
│       └── customer-portal/
│           └── route.ts                              🆕 NEW  (creates Stripe Customer Portal session)
│
├── components/
│   ├── dev/
│   │   └── DevTierToggle.tsx                         🗑️ DELETE
│   └── (all other components)                        🔒 UNTOUCHED
│
├── services/
│   ├── subscriptionService.ts                        ✏️ MODIFY  (swap mock → real Stripe/Supabase)
│   ├── articleService.ts                             🔒 UNTOUCHED  (articles stay as mock data)
│   └── userService.ts                                ✏️ MODIFY  (swap mock → real Supabase query)
│
├── lib/
│   ├── tiers.ts                                      🔒 UNTOUCHED
│   ├── safeRedirect.ts                               🔒 UNTOUCHED
│   │
│   ├── stripe/                                       🆕 NEW (folder)
│   │   ├── stripe.ts                                 🆕 NEW  (Stripe SDK initialization)
│   │   └── tierResolver.ts                           🆕 NEW  (Price ID ↔ tier mapping)
│   │
│   ├── supabase/
│   │   ├── (existing files)                          🔒 UNTOUCHED
│   │   └── admin.ts                                  🆕 NEW  (service role client, bypasses RLS)
│   │
│   └── auth/
│       ├── requireUser.ts                            🔒 UNTOUCHED
│       ├── requireRole.ts                            🔒 UNTOUCHED
│       └── requireSubscriptionTier.ts                ✏️ MODIFY  (reads from Supabase instead of cookie)
│
├── store/
│   └── useDevSubscriptionStore.ts                    🗑️ DELETE
│
├── mocks/                                            🗑️ DELETE (entire folder)
│   ├── README.md                                     🗑️ DELETE
│   └── data/                                         🗑️ DELETE
│       ├── plans.ts                                  🗑️ DELETE
│       ├── articles.ts                               🗑️ DELETE  → content moves into articleService
│       └── users.ts                                  🗑️ DELETE
│
├── types/                                            🔒 UNTOUCHED (all types preserved)
│
└── (all page files)                                  🔒 UNTOUCHED (all pages preserved)

REPO ROOT:
└── RECOVERY.md                                       ✏️ MODIFY  (update at each gate)
```

---

## 3. File Inventory Summary

| Category | New | Modified | Deleted | Untouched |
|----------|-----|----------|---------|-----------|
| API Routes | 3 | 0 | 0 | — |
| Lib (Stripe) | 2 | 0 | 0 | — |
| Lib (Supabase) | 1 | 0 | 0 | existing files |
| Lib (Auth) | 0 | 1 | 0 | requireUser, requireRole |
| Services | 0 | 2 | 0 | articleService |
| Store | 0 | 0 | 1 | — |
| Components | 0 | 0 | 1 | all others |
| Mocks | 0 | 0 | 4 | — |
| App layout | 0 | 1 | 0 | — |
| **TOTAL** | **6** | **4** | **6** | **everything else** |

**6 new files. 4 modified files. 6 deleted files. All pages and components untouched.**

---

## 4. New Files Detail

| File | Purpose | Server-Only? |
|------|---------|-------------|
| `src/app/api/checkout/route.ts` | Creates Stripe Checkout Session, returns URL | ✅ Yes |
| `src/app/api/webhooks/stripe/route.ts` | Receives Stripe webhook events, writes to Supabase | ✅ Yes |
| `src/app/api/customer-portal/route.ts` | Creates Stripe Customer Portal session | ✅ Yes |
| `src/lib/stripe/stripe.ts` | Stripe SDK initialization | ✅ Yes |
| `src/lib/stripe/tierResolver.ts` | Maps Price ID ↔ SubscriptionTier | ✅ Yes |
| `src/lib/supabase/admin.ts` | Supabase admin client (service role, bypasses RLS) | ✅ Yes |

**All 6 new files are server-only.** None are imported by client components. This is by design — all Stripe and admin Supabase operations happen server-side.

---

## 5. Modified Files Detail

| File | What Changes | What Stays |
|------|-------------|------------|
| `src/services/subscriptionService.ts` | `getCurrentSubscription()` queries Supabase. `subscribe()` calls `/api/checkout`. Remove all mock/cookie/store imports. | Method signatures. `getPlans()` (still returns hardcoded plan data). `hasAccess()`. |
| `src/services/userService.ts` | `getCurrentUser()` queries `subscriptions` table (in addition to existing auth + roles). Remove mock/cookie/store imports. | Method signature. Return type. |
| `src/lib/auth/requireSubscriptionTier.ts` | No direct changes needed — it calls `userService.getCurrentUser()` which now queries real data. Remove cookie import if any remains. | Signature. Logic. Redirect behavior. |
| `src/app/layout.tsx` | Remove DevTierToggle import and mount. Remove `process.env.NODE_ENV` check wrapper. | Everything else. |

---

## 6. Deleted Files Checklist

After all swaps are verified working:

```
□ src/mocks/README.md
□ src/mocks/data/plans.ts
□ src/mocks/data/articles.ts          → article content preserved in articleService
□ src/mocks/data/users.ts
□ src/mocks/data/                      (folder)
□ src/mocks/                           (folder)
□ src/store/useDevSubscriptionStore.ts
□ src/components/dev/DevTierToggle.tsx
□ src/components/dev/                  (folder if empty)
```

**Post-deletion verification:**
```bash
grep -r "mocks\|DevTierToggle\|dev_mock_tier\|useDevSubscription" src/
# Must return zero results
```

---

## 7. Article Data Migration Note

When `src/mocks/data/articles.ts` is deleted, the article content needs to survive somewhere. The article mock data moves INTO `articleService.ts` as a private constant. This is intentional — articles stay as static demo content in Phase 2. A real CMS integration is out of scope.

```typescript
// src/services/articleService.ts — after cleanup
// Mock articles preserved as private constant (no external mock import)
const ARTICLES: Article[] = [
  // ... same 6 articles from the mock file
];
```

---

## 8. Plans Data Note

Same pattern as articles. When `src/mocks/data/plans.ts` is deleted, the plan definitions move into `subscriptionService.ts`:

```typescript
// src/services/subscriptionService.ts — after cleanup
const PLANS: Plan[] = [
  // ... same 3 plans from the mock file
];
```

Plans are intentionally NOT fetched from Stripe in Phase 2. The pricing page layout depends on descriptions and feature lists that we control, not Stripe metadata.

---

## 9. Import Convention Updates

**New forbidden imports (Phase 2):**
- `src/lib/stripe/stripe.ts` MUST NOT be imported in any file under `src/components/` or any `"use client"` file
- `src/lib/supabase/admin.ts` MUST NOT be imported in any file under `src/components/` or any `"use client"` file
- After cleanup: zero imports from `@/mocks`, `@/store/useDevSubscriptionStore`, or `@/components/dev`

---

## 10. Sign-Off Checklist

- [ ] All new files listed with purpose and server-only flag
- [ ] All modified files specified (what changes vs what stays)
- [ ] All deleted files listed with post-deletion verification command
- [ ] Article and plan data migration strategy documented
- [ ] Import conventions updated for Phase 2 security requirements
- [ ] Tony signs off

---

**END OF FILE_TREE Phase 2**
