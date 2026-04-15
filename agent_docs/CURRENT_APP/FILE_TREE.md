# FILE_TREE: StarkReads — Subscription v1 Prototype

> **Version:** 1.1
> **Date:** 2026-04-15
> **Status:** APPROVED
> **Inherits From:** APP_BRIEF v1.2, DATA_CONTRACT v1.0, UI_SPEC v1.1
> **Author:** Architect (Claude) for Tony Stark
> **Changes from v1.0:** Renamed `(authenticated)` route group to `(members)` to match starter kit reality; added `safeRedirect.ts` lib; flagged LoginForm/RegisterForm as EXTEND (not UNTOUCHED); added NavbarHome as EXTEND; added `dev_mock_tier` cookie to disposable manifest.

---

## Purpose

This document is the **canonical file structure** for everything added by the prototype. Every new file lives where this document says it lives. No exceptions. No invented folders.

**Rule:** If a file isn't listed here, it doesn't exist in v1. If Claude Code wants to create one not listed, that's a scope creep flag — stop and ask.

---

## 1. Legend

- 🆕 **NEW** — File created in this prototype
- ✏️ **EXTEND** — Existing starter kit file, add to it (do NOT rewrite)
- 🔒 **UNTOUCHED** — Existing starter kit file, do NOT modify
- 🗑️ **DISPOSABLE** — File or folder to be deleted in Phase 2 when backend is wired

---

## 2. Full Tree

```
src/
│
├── app/
│   │
│   ├── layout.tsx                                    ✏️ EXTEND  (mount DevTierToggle dev-only)
│   │
│   ├── (public)/
│   │   ├── page.tsx                                  ✏️ EXTEND  (replace home with StarkReads landing)
│   │   ├── HomePageContent.tsx                       🆕 NEW
│   │   │
│   │   ├── articles/
│   │   │   ├── page.tsx                              🆕 NEW
│   │   │   ├── ArticlesIndexContent.tsx              🆕 NEW
│   │   │   │
│   │   │   └── [slug]/
│   │   │       ├── page.tsx                          🆕 NEW
│   │   │       └── ArticleDetailContent.tsx          🆕 NEW
│   │   │
│   │   └── pricing/
│   │       ├── page.tsx                              🆕 NEW
│   │       └── PricingPageContent.tsx                🆕 NEW
│   │
│   ├── (members)/                                    ← was (authenticated) in v1.0; renamed to match starter kit
│   │   │
│   │   ├── subscribe/
│   │   │   └── success/
│   │   │       ├── page.tsx                          🆕 NEW
│   │   │       └── SubscribeSuccessContent.tsx       🆕 NEW
│   │   │
│   │   └── members-portal/
│   │       ├── layout.tsx                            🔒 UNTOUCHED
│   │       ├── page.tsx                              ✏️ EXTEND  (add subscription summary row)
│   │       ├── MembersPortalContent.tsx              ✏️ EXTEND  (add subscription summary row)
│   │       │
│   │       ├── account/
│   │       │   ├── page.tsx                          🆕 NEW
│   │       │   └── AccountPageContent.tsx            🆕 NEW
│   │       │
│   │       ├── starter/
│   │       │   ├── page.tsx                          🆕 NEW
│   │       │   └── StarterContentPage.tsx            🆕 NEW
│   │       │
│   │       ├── pro/
│   │       │   ├── page.tsx                          🆕 NEW
│   │       │   └── ProContentPage.tsx                🆕 NEW
│   │       │
│   │       └── enterprise/
│   │           ├── page.tsx                          🆕 NEW
│   │           └── EnterpriseContentPage.tsx         🆕 NEW
│   │
│   ├── (admin)/                                      🔒 UNTOUCHED
│   │   └── ...                                       🔒 UNTOUCHED
│   │
│   ├── (superadmin)/                                 🔒 UNTOUCHED
│   │   └── ...                                       🔒 UNTOUCHED
│   │
│   ├── (auth)/                                       (route group untouched; single /auth page with tabs)
│   │   └── auth/
│   │       └── page.tsx                              🔒 UNTOUCHED  (AuthTabs — LoginForm + RegisterForm)
│   │
│   └── api/                                          🔒 UNTOUCHED  (no new routes in v1)
│
├── components/
│   │
│   ├── ui/                                           🔒 UNTOUCHED  (shadcn primitives)
│   │
│   ├── common/
│   │   ├── Page.tsx                                  🔒 UNTOUCHED
│   │   ├── Row.tsx                                   🔒 UNTOUCHED
│   │   ├── Box.tsx                                   🔒 UNTOUCHED
│   │   ├── BackButton.tsx                            🔒 UNTOUCHED
│   │   ├── Spinner.tsx                               🔒 UNTOUCHED
│   │   └── TierBadge.tsx                             🆕 NEW
│   │
│   ├── auth/                                         (folder exists in starter kit)
│   │   ├── LoginForm.tsx                             ✏️ EXTEND  (add ?next= plumbing, ~5 lines)
│   │   └── RegisterForm.tsx                          ✏️ EXTEND  (add ?next= plumbing, ~5 lines)
│   │
│   ├── global/
│   │   ├── Navbar.tsx                                ✏️ EXTEND  (Pricing link + TierBadge — authenticated)
│   │   ├── NavbarHome.tsx                            ✏️ EXTEND  (Articles + Pricing links — public)
│   │   └── ThemeToggler.tsx                          🔒 UNTOUCHED
│   │
│   ├── layout/
│   │   ├── Sidebar.tsx                               ✏️ EXTEND  (add Premium Content group)
│   │   └── AdminSidebar.tsx                          🔒 UNTOUCHED
│   │
│   ├── articles/                                     🆕 NEW (folder)
│   │   ├── ArticleCard.tsx                           🆕 NEW
│   │   └── Paywall.tsx                               🆕 NEW
│   │
│   ├── subscriptions/                                🆕 NEW (folder)
│   │   └── PlanCard.tsx                              🆕 NEW
│   │
│   └── dev/                                          🆕 NEW (folder, 🗑️ DISPOSABLE in Phase 2)
│       └── DevTierToggle.tsx                         🆕 NEW  🗑️
│
├── services/
│   ├── (existing services)                           🔒 UNTOUCHED
│   ├── subscriptionService.ts                        🆕 NEW
│   ├── articleService.ts                             🆕 NEW
│   └── userService.ts                                🆕 NEW
│
├── types/
│   ├── (existing types)                              🔒 UNTOUCHED
│   ├── subscription.ts                               🆕 NEW
│   ├── article.ts                                    🆕 NEW
│   └── user.ts                                       🆕 NEW
│
├── lib/
│   ├── utils.ts                                      🔒 UNTOUCHED  (cn() already exists)
│   ├── tiers.ts                                      🆕 NEW
│   ├── safeRedirect.ts                               🆕 NEW  (?next= validation, prevents open-redirect)
│   │
│   └── auth/
│       ├── requireUser.ts                            🔒 UNTOUCHED
│       ├── requireRole.ts                            🔒 UNTOUCHED
│       └── requireSubscriptionTier.ts                🆕 NEW  (reads dev_mock_tier cookie server-side)
│
├── store/
│   ├── (existing stores)                             🔒 UNTOUCHED
│   └── useDevSubscriptionStore.ts                    🆕 NEW  🗑️
│
└── mocks/                                            🆕 NEW (folder, 🗑️ DISPOSABLE in Phase 2)
    ├── README.md                                     🆕 NEW  🗑️  (deletion instructions)
    └── data/                                         🆕 NEW  🗑️
        ├── plans.ts                                  🆕 NEW  🗑️
        ├── articles.ts                               🆕 NEW  🗑️
        └── users.ts                                  🆕 NEW  🗑️

REPO ROOT:
└── RECOVERY.md                                       🆕 NEW  (updated at each sign-off gate)
```

---

## 3. File Inventory Summary

| Category | New Files | Extended Files | Untouched (verified) |
|----------|-----------|----------------|----------------------|
| App Routes (`app/`) | 18 | 4 | All RBAC routes |
| Components (`components/`) | 4 | 4 | All starter kit primitives |
| Services (`services/`) | 3 | 0 | All existing services |
| Types (`types/`) | 3 | 0 | All existing types |
| Lib (`lib/`) | 3 | 0 | utils.ts, requireUser, requireRole |
| Store (`store/`) | 1 | 0 | All existing stores |
| Mocks (`mocks/`) | 4 | 0 | n/a |
| Repo root | 1 (RECOVERY.md) | 0 | n/a |
| **TOTAL NEW FILES** | **37** | **8** | **all RBAC core** |

---

## 4. Disposable Manifest (for Phase 2 Cleanup)

When backend is wired in Phase 2, these files/folders are DELETED entirely:

```
src/mocks/                          ← entire folder
src/store/useDevSubscriptionStore.ts
src/components/dev/                 ← entire folder
```

**Phase 2 also CLEARS:**
```
dev_mock_tier cookie                ← clear from all environments; replaced by Supabase session cookie
```

**Phase 2 REPLACES (not deletes) the internals of:**
```
src/services/subscriptionService.ts   ← swap mock impl for Supabase + Stripe calls
src/services/articleService.ts        ← swap mock impl for Supabase queries
src/services/userService.ts           ← swap mock impl for Supabase queries
src/lib/auth/requireSubscriptionTier.ts  ← swap cookie read for Supabase session lookup
```

The service file LOCATIONS and SIGNATURES stay identical. Only the function bodies change. Same for `requireSubscriptionTier` — same signature, internals swap from cookie read to Supabase query.

**Phase 2 ADDS (does not exist in v1):**
```
src/app/api/checkout/route.ts                    ← creates Stripe Checkout Session
src/app/api/webhooks/stripe/route.ts             ← receives & verifies Stripe webhooks
supabase/migrations/00X_subscriptions.sql        ← subscriptions table + RLS
```

**Phase 2 KEEPS (not disposable):**
```
src/lib/safeRedirect.ts             ← still needed for ?next= validation
src/lib/tiers.ts                    ← still needed for cumulative hierarchy logic
src/components/common/TierBadge.tsx ← still needed for UI
src/components/articles/Paywall.tsx ← still needed for UI
src/components/subscriptions/PlanCard.tsx ← still needed for UI
src/components/articles/ArticleCard.tsx ← still needed for UI
LoginForm + RegisterForm ?next= plumbing ← still needed
Both navbar extensions ← still needed
Sidebar extension ← still needed
All page files ← still needed
```

---

## 5. Folder Conventions (Recap from Starter Kit)

These are inherited rules — Claude Code MUST follow them:

**Page files (`page.tsx`):**
- 3-8 lines maximum
- Imports the corresponding `*PageContent.tsx` and renders it
- No logic, no styling, no data fetching directly

**PageContent files (`*Content.tsx`):**
- The actual page implementation
- Server Component unless interactivity requires `"use client"`
- Data fetching at the top, render below

**Component files:**
- One component per file
- File name matches component name (PascalCase)
- Named export AND default export

**Service files:**
- Single object export named `{domain}Service` (e.g., `subscriptionService`)
- All methods async, even if synchronous (forward compatibility for backend swap)
- No imports from `src/app/` or `src/components/` (services are leaves in the dependency graph)

**Type files:**
- Named exports for each type/interface
- Re-export shared utilities from `lib/` if relevant
- No runtime code (types only)

**Mock files:**
- Located in `src/mocks/data/`
- Export named constants: `mockPlans`, `mockArticles`, etc.
- Type-checked against the contract types — mocks must satisfy the real type signatures

**Store files:**
- Named exports for the hook AND selectors
- Pattern: `useFooStore`, `selectFooBar`
- No async logic in store — services handle async

---

## 6. Import Conventions

Use absolute imports via `@/` prefix throughout:

```typescript
// ✅ CORRECT
import { Page } from '@/components/common/Page';
import { subscriptionService } from '@/services/subscriptionService';
import type { SubscriptionTier } from '@/types/subscription';

// ❌ WRONG
import { Page } from '../../../components/common/Page';
```

**Forbidden imports:**
- Components MUST NOT import from `@/mocks` directly (only services may)
- Components MUST NOT import Supabase clients directly (services handle it)
- `useDevSubscriptionStore` MUST NOT be imported anywhere except:
  - `src/services/subscriptionService.ts` (for client-side reads, if any)
  - `src/services/userService.ts` (for client-side reads, if any)
  - `src/components/dev/DevTierToggle.tsx` (for the toggle widget itself)
- The `dev_mock_tier` cookie MUST be read only by:
  - `src/lib/auth/requireSubscriptionTier.ts` (server-side)
  - `src/services/*` (server-side service implementations)
- `safeRedirect()` MUST be called everywhere a `?next=` value is consumed — never use the raw value

---

## 7. RECOVERY.md (NEW — Repo Root)

**Purpose:** Disaster recovery file per Stark Software Factory playbook. Updated at each of the three sign-off gates.

**Location:** Repo root (visible, not hidden)

**Template:**

```markdown
# RECOVERY — StarkReads Subscription v1 Prototype

## Last Action
[What was just completed in this session]

## Pending
[What is in progress but not finished]

## Next Step
[The very next thing to do]

## Files Modified This Session
- path/to/file.ts — what changed
- path/to/other.tsx — what changed

## Gate Status
- [ ] Gate 1: Foundation (Steps 1-7)
- [ ] Gate 2: Components + Layout + Auth Forms (Steps 8-11)
- [ ] Gate 3: Pages + Smoke Test (Steps 12-15)
```

**Update protocol:** At each pause gate, before notifying Tony, update this file. Never display a plan in CLI without writing the session state first.

---

## 8. Sign-Off Checklist

- [ ] Every new file has a defined location
- [ ] Every extended file is flagged (no surprise rewrites)
- [ ] Every untouched file is explicitly marked
- [ ] Disposable files manifested for Phase 2 cleanup (including `dev_mock_tier` cookie)
- [ ] Folder conventions documented
- [ ] Import conventions enforced (including cookie/store read restrictions)
- [ ] RECOVERY.md template defined
- [ ] Tony signs off on this FILE_TREE v1.1

---

**END OF FILE_TREE v1.1**
