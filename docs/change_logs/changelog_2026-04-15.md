# Changelog — 2026-04-15

## StarkReads Prototype Build (Gates 1–3)

**Branch:** `step-0` → `step-1`
**Author:** Claude Code `[CC]` + Tony Stark `[TS]`
**Scope:** Full frontend-first prototype — 37 new files, 9 modified files

---

### Gate 1: Foundation (Steps 1–6) `[CC]`

**Types** — `src/types/`
- `subscription.ts` — SubscriptionTier, Plan, UserSubscription, SubscriptionState types
- `article.ts` — Article type with tier gating fields
- `user.ts` — MockUser type for dev mode

**Mock Data** — `src/mocks/`
- `plans.ts` — 3 subscription plans (Starter $9, Pro $29, Enterprise $99)
- `articles.ts` — 6 mock articles across all tiers with full content
- `users.ts` — Mock user data for dev mode
- `README.md` — Mock data documentation

**Lib/Helpers** — `src/lib/`
- `tiers.ts` — Tier hierarchy, `meetsTier()` comparison, display names
- `safeRedirect.ts` — Whitelist-based redirect validation for `?next=` params
- `auth/requireSubscriptionTier.ts` — Server-side tier gate helper

**State** — `src/store/`
- `useDevSubscriptionStore.ts` — Zustand store for dev tier switching (persisted)

**Services** — `src/services/`
- `subscriptionService.ts` — Mock subscribe/cancel/get operations
- `articleService.ts` — Mock article CRUD with tier filtering
- `userService.ts` — Mock user service with tier-aware responses

---

### Gate 2: Components + Layout + Auth Forms (Steps 7–10) `[CC]`

**New Components** — `src/components/`
- `common/TierBadge.tsx` — Color-coded subscription tier badge
- `articles/ArticleCard.tsx` — Article preview card with tier badge
- `articles/Paywall.tsx` — Gradient fade paywall with auth-aware CTA
- `subscriptions/PlanCard.tsx` — Pricing card with feature list + subscribe button
- `common/DevTierToggle.tsx` — Floating dev widget for tier switching

**Extended Files**
- `src/app/layout.tsx` — Mounted DevTierToggle
- `src/components/global/Navbar.tsx` — Added Articles/Pricing links + TierBadge
- `src/components/global/NavbarHome.tsx` — Added Articles/Pricing links
- `src/components/layout/Sidebar.tsx` — Premium Content group with lock icons
- `src/components/auth/LoginForm.tsx` — `?next=` param plumbing
- `src/components/auth/RegisterForm.tsx` — `?next=` param plumbing

**Doc Fixes** `[CC]`
- Corrected auth route from `/auth/signin` → `/auth` in APP_BRIEF, FILE_TREE, UI_SPEC

---

### Gate 3: All Pages + Build Verification (Steps 11–13) `[CC]`

**Public Pages**
- `src/app/(public)/HomePageContent.tsx` — Full rewrite: StarkReads hero, article grid, pricing teaser
- `src/app/(public)/articles/page.tsx` + `ArticlesIndexContent.tsx` — Article index with tier badges
- `src/app/(public)/articles/[slug]/page.tsx` + `ArticleDetailContent.tsx` — Article detail + Paywall
- `src/app/(public)/pricing/page.tsx` + `PricingPageContent.tsx` — 3-column pricing, Pro highlighted

**Member Pages**
- `src/app/(members)/subscribe/success/page.tsx` + `SubscribeSuccessContent.tsx` — Success page with `?next=` support
- `src/app/(members)/members-portal/MembersPortalContent.tsx` — Subscription summary card
- `src/app/(members)/members-portal/account/page.tsx` + `AccountPageContent.tsx` — Profile + subscription management

**Tier-Gated Pages**
- `src/app/(members)/members-portal/starter/page.tsx` + `StarterContentPage.tsx` — Starter+ gated
- `src/app/(members)/members-portal/pro/page.tsx` + `ProContentPage.tsx` — Pro+ gated, links to Starter
- `src/app/(members)/members-portal/enterprise/page.tsx` + `EnterpriseContentPage.tsx` — Enterprise gated, links to all

**Build Fix**
- `src/app/(auth)/auth/page.tsx` — Added `<Suspense>` boundary for `useSearchParams()`

---

### Verification

| Check | Result |
|-------|--------|
| `tsc --noEmit` | Clean — 0 errors |
| `npm test` | 81/81 passed |
| `npm run build` | Clean — 30 routes generated |
