# FILE REFERENCE

> **Every file in the project, walked top to bottom.**
> **Tags:** 🟢 = added by StarkReads (Phase 1/2), 🔵 = inherited from RBAC starter kit, ⚙️ = config/infrastructure
> **Last reviewed:** 2026-05-03

---

## Table of Contents

1. [App Routes (`src/app/`)](#1-app-routes-srcapp)
2. [Components (`src/components/`)](#2-components-srccomponents)
3. [Services (`src/services/`)](#3-services-srcservices)
4. [Lib (`src/lib/`)](#4-lib-srclib)
5. [Types (`src/types/`)](#5-types-srctypes)
6. [Utils (`src/utils/`)](#6-utils-srcutils)
7. [Store (`src/store/`)](#7-store-srcstore)
8. [Tests (`src/__tests__/` and `e2e/`)](#8-tests)
9. [Scripts (`scripts/`)](#9-scripts)
10. [Config Files (root)](#10-config-files-root)
11. [Documentation (`docs/`, `agent_docs/`)](#11-documentation)

---

## 1. App Routes (`src/app/`)

### Root layout

| File | Server/Client | Tag | Purpose |
|------|--------------|-----|---------|
| `app/layout.tsx` | Server | 🔵 | Root layout — metadata, global styles, ThemeProvider, Toaster |
| `app/layout-org.tsx` | — | 🔵 | Reference/backup of original layout |
| `app/not-found.tsx` | Server | 🔵 | Custom 404 |
| `app/globals.scss` | — | 🔵 | Global styles (Sass) |
| `app/providers/ThemeProvider.tsx` | Client | 🔵 | next-themes wrapper |

### Auth group `(auth)`

| File | Server/Client | Tag | Purpose |
|------|--------------|-----|---------|
| `app/(auth)/layout.tsx` | Server | 🔵 | Auth pages layout |
| `app/(auth)/auth/page.tsx` | Server | 🔵 | Combined login/register page (uses `AuthTabs`) |
| `app/(auth)/auth/loading.tsx` | Server | 🔵 | Loading skeleton |

### Public group `(public)`

| File | Server/Client | Tag | Purpose |
|------|--------------|-----|---------|
| `app/(public)/layout.tsx` | Server | 🟢 | Public section layout |
| `app/(public)/page.tsx` | Server | 🟢 | Homepage with hero |
| `app/(public)/HomePageContent.tsx` | Mixed | 🟢 | Homepage body — hero + recent articles |
| `app/(public)/loading.tsx` | Server | 🟢 | Loading skeleton |
| `app/(public)/articles/page.tsx` | Server | 🟢 | Articles index |
| `app/(public)/articles/loading.tsx` | Server | 🟢 | Loading skeleton |
| `app/(public)/articles/ArticlesIndexContent.tsx` | Mixed | 🟢 | Article grid |
| `app/(public)/articles/[slug]/page.tsx` | Server | 🟢 | Article detail |
| `app/(public)/articles/[slug]/loading.tsx` | Server | 🟢 | Loading skeleton |
| `app/(public)/articles/[slug]/ArticleDetailContent.tsx` | Mixed | 🟢 | Article body + paywall |
| `app/(public)/pricing/page.tsx` | Server | 🟢 | Pricing page |
| `app/(public)/pricing/loading.tsx` | Server | 🟢 | Loading skeleton |
| `app/(public)/pricing/PricingPageContent.tsx` | Client | 🟢 | 3-column plan grid (uses `PlanCard`) |
| `app/(public)/demo/page.tsx` | Server | 🔵 | Demo page (starter kit) |
| `app/(public)/demo/DemoPageContent.tsx` | — | 🔵 | Demo content |

### Members group `(members)`

| File | Server/Client | Tag | Purpose |
|------|--------------|-----|---------|
| `app/(members)/layout.tsx` | Server | 🔵 | Authenticated section layout — auth-gated |
| `app/(members)/not-found.tsx` | Server | 🔵 | 404 for members |
| `app/(members)/members-portal/page.tsx` | Server | 🟢 | Members dashboard |
| `app/(members)/members-portal/loading.tsx` | Server | 🟢 | Loading skeleton |
| `app/(members)/members-portal/MembersPortalContent.tsx` | Client | 🟢 | Dashboard body — reads tier from Supabase |
| `app/(members)/members-portal/account/page.tsx` | Server | 🟢 | Account page |
| `app/(members)/members-portal/account/loading.tsx` | Server | 🟢 | Loading skeleton |
| `app/(members)/members-portal/account/AccountPageContent.tsx` | Client | 🟢 | Profile + Manage Subscription button (calls `/api/customer-portal`) |
| `app/(members)/members-portal/profile/page.tsx` | Server | 🔵 | Profile page |
| `app/(members)/members-portal/profile/loading.tsx` | Server | 🔵 | Loading skeleton |
| `app/(members)/members-portal/profile/ProfileForm.tsx` | Client | 🔵 | Profile edit form |
| `app/(members)/members-portal/starter/page.tsx` | Server | 🟢 | Starter-tier gated page (uses `requireSubscriptionTier('starter', …)`) |
| `app/(members)/members-portal/starter/loading.tsx` | Server | 🟢 | Loading skeleton |
| `app/(members)/members-portal/starter/StarterContentPage.tsx` | Mixed | 🟢 | Starter content body |
| `app/(members)/members-portal/pro/page.tsx` | Server | 🟢 | Pro-tier gated page |
| `app/(members)/members-portal/pro/loading.tsx` | Server | 🟢 | Loading skeleton |
| `app/(members)/members-portal/pro/ProContentPage.tsx` | Mixed | 🟢 | Pro content body |
| `app/(members)/members-portal/enterprise/page.tsx` | Server | 🟢 | Enterprise-tier gated page |
| `app/(members)/members-portal/enterprise/loading.tsx` | Server | 🟢 | Loading skeleton |
| `app/(members)/members-portal/enterprise/EnterpriseContentPage.tsx` | Mixed | 🟢 | Enterprise content body |
| `app/(members)/subscribe/success/page.tsx` | Server | 🟢 | Post-checkout success page |
| `app/(members)/subscribe/success/loading.tsx` | Server | 🟢 | Loading skeleton |
| `app/(members)/subscribe/success/SubscribeSuccessContent.tsx` | Client | 🟢 | Polls `subscriptionService` until tier flips, then redirects |
| `app/(members)/booking/page.tsx` | Server | 🔵 | Booking page (starter kit) |
| `app/(members)/booking/loading.tsx` | Server | 🔵 | Loading skeleton |
| `app/(members)/booking/InsertForm.tsx` | Client | 🔵 | Booking form |

### Admin group `(admin)`

| File | Server/Client | Tag | Purpose |
|------|--------------|-----|---------|
| `app/(admin)/layout.tsx` | Server | 🔵 | Admin section layout — role-gated |
| `app/(admin)/not-found.tsx` | Server | 🔵 | 404 for admin |
| `app/(admin)/admin-portal/page.tsx` | Server | 🔵 | User-management list |
| `app/(admin)/admin-portal/loading.tsx` | Server | 🔵 | Loading skeleton |
| `app/(admin)/admin-portal/AdminPortalPageContent.tsx` | Mixed | 🔵 | Admin portal body |
| `app/(admin)/admin-portal/DeleteUserButton.tsx` | Client | 🔵 | Delete confirmation |
| `app/(admin)/admin-portal/actions.ts` | Server | 🔵 | Server actions for user CRUD |
| `app/(admin)/admin-portal/add-member/page.tsx` | Server | 🔵 | Add member form page |
| `app/(admin)/admin-portal/add-member/AddMemberForm.tsx` | Client | 🔵 | Add member form |
| `app/(admin)/admin-portal/edit/[id]/page.tsx` | Server | 🔵 | Edit user page |
| `app/(admin)/admin-portal/edit/[id]/EditUserForm.tsx` | Client | 🔵 | Edit user form |
| `app/(admin)/profile/page.tsx` | Server | 🔵 | Admin profile page |
| `app/(admin)/profile/loading.tsx` | Server | 🔵 | Loading skeleton |
| `app/(admin)/profile/ProfileForm.tsx` | Client | 🔵 | Admin profile form |
| `app/(admin)/users/page.tsx` | Server | 🔵 | Users list (admin view) |
| `app/(admin)/users/loading.tsx` | Server | 🔵 | Loading skeleton |
| `app/(admin)/users/UserPageContent.tsx` | Mixed | 🔵 | Users list body |
| `app/(admin)/admin-booking/page.tsx` | Server | 🔵 | Admin booking page |
| `app/(admin)/admin-booking/loading.tsx` | Server | 🔵 | Loading skeleton |
| `app/(admin)/admin-booking/InsertForm.tsx` | Client | 🔵 | Admin booking form |

### Superadmin group `(superadmin)`

| File | Server/Client | Tag | Purpose |
|------|--------------|-----|---------|
| `app/(superadmin)/layout.tsx` | Server | 🔵 | Superadmin section layout — role-gated |
| `app/(superadmin)/not-found.tsx` | Server | 🔵 | 404 for superadmin |
| `app/(superadmin)/superadmin-portal/page.tsx` | Server | 🔵 | Superadmin user-management |
| `app/(superadmin)/superadmin-portal/loading.tsx` | Server | 🔵 | Loading skeleton |
| `app/(superadmin)/superadmin-portal/SuperadminPortalPageContent.tsx` | Mixed | 🔵 | Body |
| `app/(superadmin)/superadmin-portal/DeleteUserButton.tsx` | Client | 🔵 | Delete confirmation |
| `app/(superadmin)/superadmin-portal/actions.ts` | Server | 🔵 | Server actions |
| `app/(superadmin)/superadmin-portal/add-user/page.tsx` | Server | 🔵 | Add user page |
| `app/(superadmin)/superadmin-portal/add-user/AddUserForm.tsx` | Client | 🔵 | Add user form |
| `app/(superadmin)/superadmin-portal/edit/[id]/page.tsx` | Server | 🔵 | Edit user page |
| `app/(superadmin)/superadmin-portal/edit/[id]/EditUserForm.tsx` | Client | 🔵 | Edit user form |

### Template + error

| File | Server/Client | Tag | Purpose |
|------|--------------|-----|---------|
| `app/template/page.tsx` | Server | 🔵 | Template page (reference) |
| `app/template/loading.tsx` | Server | 🔵 | Loading skeleton |
| `app/template/TemplatePageContent.tsx` | — | 🔵 | Template content |
| `app/error/page.tsx` | Server | 🔵 | Error page |
| `app/error/loading.tsx` | Server | 🔵 | Loading skeleton |

### API routes (`src/app/api/`)

| File | Tag | Purpose |
|------|-----|---------|
| `app/api/auth/login/route.ts` | 🔵 | POST email/password login |
| `app/api/auth/logout/route.ts` | 🔵 | POST logout |
| `app/api/auth/logout/route-1.ts` | 🔵 | Backup/reference logout |
| `app/api/auth/signup/route.ts` | 🔵 | POST user registration |
| `app/api/auth/confirm/route.ts` | 🔵 | GET email confirmation callback |
| `app/api/auth/superadmin-add-user/route.ts` | 🔵 | POST programmatic user creation (superadmin only) |
| `app/api/checkout/route.ts` | 🟢 | **POST** create Stripe Checkout / update existing sub |
| `app/api/customer-portal/route.ts` | 🟢 | **POST** create Stripe Customer Portal session |
| `app/api/webhooks/stripe/route.ts` | 🟢 | **POST** receive Stripe webhook events |
| `app/api/ghl/hooktest/route.ts` | 🔵 | Test/unused fixture |

---

## 2. Components (`src/components/`)

### `ui/` — ShadCN primitives 🔵

`avatar.tsx`, `badge.tsx`, `button.tsx`, `card.tsx`, `command.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `form.tsx`, `input.tsx`, `label.tsx`, `pagination.tsx`, `select.tsx`, `table.tsx`, `tabs.tsx`, `textarea.tsx`, `toaster.tsx`, `toast.tsx`, `use-toast.ts`

All Radix-based, headless, mostly client (use Radix hooks).

### `common/`

| File | Tag | Purpose |
|------|-----|---------|
| `BackButton.tsx` | 🔵 | Navigation back button |
| `Box.tsx` | 🔵 | Generic flex container |
| `Container.tsx` | 🔵 | Max-width wrapper |
| `Main.tsx` | 🔵 | Main content wrapper |
| `Page.tsx` | 🔵 | Page layout wrapper |
| `PaginationControls.tsx` | 🔵 | Client-side pagination |
| `Row.tsx` | 🔵 | Horizontal flex row |
| `Spinner.tsx` | 🔵 | Small loading spinner |
| `SpinnerLarge.tsx` | 🔵 | Large loading spinner |
| `TierBadge.tsx` | 🟢 | Tier badge with color coding |

### `global/`

| File | Server/Client | Tag | Purpose |
|------|--------------|-----|---------|
| `Navbar.tsx` | Client | 🔵 | Main nav (reads auth store + Supabase tier) |
| `NavbarHome.tsx` | Server | 🔵 | Homepage navbar variant |
| `NavbarLoginReg.tsx` | Server | 🔵 | Auth pages navbar |
| `NavbarSuperadmin.tsx` | Client | 🔵 | Superadmin navbar |
| `ThemeToggler.tsx` | Client | 🔵 | Dark/light toggle |

### `layout/`

| File | Server/Client | Tag | Purpose |
|------|--------------|-----|---------|
| `AdminSidebar.tsx` | Client | 🔵 | Admin sidebar |
| `Sidebar.tsx` | Client | 🔵 | Members sidebar (reads tier) |
| `SuperadminSidebar.tsx` | Client | 🔵 | Superadmin sidebar |

### `auth/`

| File | Server/Client | Tag | Purpose |
|------|--------------|-----|---------|
| `AuthTabs.tsx` | Client | 🔵 | Login/Register tab switcher |
| `LoginForm.tsx` | Client | 🔵 | Login form |
| `Logout.tsx` | Client | 🔵 | Logout button |
| `RegisterForm.tsx` | Client | 🔵 | Registration form |

### `articles/` 🟢

| File | Server/Client | Purpose |
|------|--------------|---------|
| `ArticleCard.tsx` | Server | Article preview card |
| `Paywall.tsx` | Client | Tier-gated paywall (CTAs) |

### `subscriptions/` 🟢

| File | Server/Client | Purpose |
|------|--------------|---------|
| `PlanCard.tsx` | Client | Pricing card with subscribe button (calls `checkoutService.subscribe`) |

### `posts/` 🔵, `jsonsrv/` 🔵, `admin/` 🔵, `members/` 🔵, `dashboard/` 🔵

Inherited starter-kit components for posts management, JSONPlaceholder posts, admin booking list, member events, and dashboard cards. Not part of the StarkReads subscription system but kept for completeness.

---

## 3. Services (`src/services/`)

| File | Server/Client | Tag | Exports | Purpose |
|------|--------------|-----|---------|---------|
| `userService.ts` | **Server-only** | 🟢 | `userService` (`getCurrentUser`) | Joins auth + role + subscription into a `User` |
| `subscriptionService.ts` | **Server-only** | 🟢 | `PLANS`, `mapRowToSubscription`, `subscriptionService` (`getCurrentSubscription`, `getPlans`, `hasAccess`) | Reads `subscriptions` table; provides hardcoded `PLANS` |
| `checkoutService.ts` | Client-safe | 🟢 | `checkoutService` (`subscribe`) | POSTs `/api/checkout`, returns `{redirect_url}` |
| `articleService.ts` | Either | 🟢 | `articleService` (`getAll`, `getBySlug`, `getRecent`) | Hardcoded array of 6 articles (CMS deferred) |
| `postServices.ts` | Either | 🔵 | CRUD against `NEXT_PUBLIC_API_BASE_URL` posts API | Starter kit |
| `jsonsrvPostServices.ts` | Either | 🔵 | CRUD against JSONPlaceholder | Starter kit demo |

**Server vs client split:** `userService` and `subscriptionService` import `@/utils/supabase/admin` and are server-only. `checkoutService` is a fetch wrapper and is client-safe. Components on the pricing/account pages call `checkoutService` from client-side handlers.

---

## 4. Lib (`src/lib/`)

| File | Server/Client | Tag | Exports | Purpose |
|------|--------------|-----|---------|---------|
| `tiers.ts` | Either | 🟢 | `meetsTier`, `tierDisplayName` | Pure tier comparison + display |
| `auth/requireSubscriptionTier.ts` | **Server-only** | 🟢 | `requireSubscriptionTier(required, currentPath)` | Server-side gate that redirects unauth/insufficient-tier users |
| `stripe/stripe.ts` | **Server-only** | 🟢 | `stripe` (singleton) | Stripe SDK init using `STRIPE_SECRET_KEY` |
| `stripe/tierResolver.ts` | **Server-only** | 🟢 | `resolveTierFromPriceId`, `resolvePriceIdFromTier` | Maps env-var-defined Price IDs ↔ tiers |
| `safeRedirect.ts` | Either | 🟢 | `safeRedirect(next)` | Validates `next` URLs to prevent open-redirect |
| `utils.ts` | Either | 🔵 | `cn(...inputs)` | clsx + tailwind-merge |

---

## 5. Types (`src/types/`)

| File | Tag | Exports |
|------|-----|---------|
| `subscription.ts` | 🟢 | `SubscriptionTier`, `TIER_LEVELS`, `Subscription`, `Plan` |
| `user.ts` | 🟢 (modified — added `subscription`) | `UserRole`, `User` |
| `article.ts` | 🟢 | `Article` |
| `posts.ts` | 🔵 | `Post`, `PostComment`, `Results` |
| `tailwind-merge.d.ts` | 🔵 | Module augmentation for `tailwind-merge` |

---

## 6. Utils (`src/utils/`)

### Supabase clients

| File | Server/Client | Tag | Purpose |
|------|--------------|-----|---------|
| `supabase/server.ts` | **Server-only** | 🔵 | `createClient()` — RLS-aware, cookie-based |
| `supabase/admin.ts` | **Server-only** | 🔵 | `createAdminClient()` — service-role, bypasses RLS |
| `supabase/client.ts` | Client-safe | 🔵 | Browser client (anon key) |
| `supabase/actions.ts` | Server | 🔵 | Auth-related server actions |
| `supabase/fetchUserData.ts` | Server | 🔵 | User data fetch helper |
| `supabase/middleware.ts` | Server | 🔵 | Cookie session refresh middleware |
| `supabase/middleware.org.ts` | — | 🔵 | Reference/backup |
| `supabase/server.org.ts` | — | 🔵 | Reference/backup |
| `supabase/server-1.ts` | — | 🔵 | Reference/backup |

### Other

| File | Tag | Exports |
|------|-----|---------|
| `get-user-role.ts` | 🔵 | `AppRole` enum, `getUserRole(userId)` |
| `common/commonUtils.ts` | 🔵 | `formatDate(isoString)` |
| `jsonSrv/jsonsrvUtils.ts` | 🔵 | `getFilteredAndSortedPosts(posts, limit?)` |

---

## 7. Store (`src/store/`)

| File | Tag | State | Persist | Purpose |
|------|-----|-------|---------|---------|
| `useAuthStore.ts` | 🔵 | `user`, `role`, `isAuthenticated`, `isLoading` | localStorage `auth-store` | Auth state, login/logout actions |
| `usePostStore.ts` | 🔵 | `post`, `posts`, `totalPosts`, modal state | No | Posts CRUD state (starter) |
| `useJsonsrvPostStore.ts` | 🔵 | `posts`, `totalPosts`, modal state | No | JSONPlaceholder posts (starter) |

> The Phase 1 `useDevSubscriptionStore.ts` and `DevTierToggle.tsx` were **deleted** in Phase 2 (Gate 3) — subscription state now comes from Supabase, not a dev cookie.

---

## 8. Tests

### Unit + Integration (`src/__tests__/`)

| File | Tag | Tests | Coverage |
|------|-----|-------|----------|
| `actions.test.ts` | 🔵 | many | `protectPage()` server action |
| `admin/actions.test.ts` | 🔵 | many | Admin server actions |
| `admin/AddMemberForm.test.tsx` | 🔵 | many | Admin add-member form |
| `api/checkout.test.ts` | 🟢 | 4 | Stripe checkout route (integration) |
| `api/customer-portal.test.ts` | 🟢 | 3 | Stripe portal route (integration) |
| `api/webhook.test.ts` | 🟢 | 6 | Stripe webhook (integration) |
| `get-user-role.test.ts` | 🔵 | many | `getUserRole()` |
| `lib/pure-functions.test.ts` | 🟢 | many | `meetsTier`, `tierDisplayName`, `safeRedirect`, tier resolver |
| `member/ProfileForm.test.tsx` | 🔵 | many | Profile form |
| `proxy.test.ts` | 🔵 | many | Reverse proxy |
| `superadmin-add-user.test.ts` | 🔵 | many | Superadmin user creation |
| `superadmin/actions.test.ts` | 🔵 | many | Superadmin server actions |
| `superadmin/AddUserForm.test.tsx` | 🔵 | many | Superadmin add-user form |
| `superadmin/EditUserForm.test.tsx` | 🔵 | many | Superadmin edit-user form |
| `superadmin/SuperadminPortalPageContent.test.tsx` | 🔵 | many | Superadmin portal page |
| `jest.setup.ts` | 🔵 | — | Setup: env defaults + `next/navigation` + `next/cache` mocks |

### E2E (`e2e/`)

| File | Tag | Tests | Coverage |
|------|-----|-------|----------|
| `auth-flow.spec.ts` | 🟢 | 3 | Register / logout / login |
| `navbar-badge.spec.ts` | 🟢 | 3 | Tier badges in navbar |
| `paywall.spec.ts` | 🟢 | 4 | Paywall CTAs by tier |
| `public-access.spec.ts` | 🟢 | 5 | Anonymous browsing |
| `subscription-gating.spec.ts` | 🟢 | 3 | Tier hierarchy enforcement |

### E2E helpers (`e2e/helpers/`)

| File | Tag | Purpose |
|------|-----|---------|
| `supabase-admin.ts` | 🟢 | Service-role client for E2E (loads `.env.local` via `dotenv`) |
| `seed-subscription.ts` | 🟢 | `seedSubscription`, `deleteSubscription` |
| `test-user.ts` | 🟢 | `uniqueEmail`, `registerUser`, `loginUser`, `getUserId`, `deleteTestUser` |

---

## 9. Scripts (`scripts/`) 🟢

| File | Wraps |
|------|-------|
| `run_unit_tests.sh` | `npm test` |
| `run_stripe_integration_test.sh` | `npm run test:integration` |
| `run_e2e_tests.sh` | `npm run test:e2e` |
| `start_stripe_webhook.sh` | `stripe listen --forward-to localhost:3000/api/webhooks/stripe` |

All `chmod +x`, `bash` shebang, `set -euo pipefail`, auto-`cd` to project root.

---

## 10. Config Files (root) ⚙️

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, npm scripts (`test`, `test:integration`, `test:e2e`, `test:e2e:ui`, `dev`, `build`, `start`, `lint`) |
| `package-lock.json` | npm lockfile |
| `tsconfig.json` | TypeScript config |
| `next.config.ts` (or `.js`) | Next.js config |
| `tailwind.config.ts` | Tailwind config |
| `postcss.config.js` | PostCSS config |
| `jest.config.js` | Jest config (`ts-jest`, `node` env, `clearMocks: true`, alias `@/`) |
| `playwright.config.ts` | Playwright config (Chromium only, auto-dev-server) |
| `.gitignore` | Excludes `node_modules`, `.next`, `.env.local`, Playwright artifacts |
| `.env.local` | **Local secrets** — never committed |
| `.env.example` | Template for `.env.local` (if present — recommended addition) |

---

## 11. Documentation

### `docs/` 🟢

| File | Purpose |
|------|---------|
| `ARCHITECTURE.md` | System architecture deep dive |
| `API_REFERENCE.md` | Every API route documented |
| `DATABASE_SCHEMA.md` | Schema, RLS, two-clients pattern, migration SQL |
| `SUBSCRIPTION_SYSTEM.md` | Tier model, gates, Stripe integration |
| `TESTING.md` | Four-layer testing strategy, run commands |
| `TESTING_RECON.md` | Architect-level raw inventory of tests |
| `DEPLOYMENT.md` | Local + production setup |
| `FILE_REFERENCE.md` | This file |
| `DEVELOPMENT_GUIDE.md` | Day-to-day recipes |

### `agent_docs/` 🟢

Factory specs and starter-kit docs:
- `STARTER_PROJECT_OVERVIEW.md` — overview of the starter kit
- `CURRENT_APP/PHASE_1_FRONTEND/` — APP_BRIEF, DATA_CONTRACT, FILE_TREE, UI_SPEC for Phase 1
- `CURRENT_APP/PHASE_2_BACKEND/` — APP_BRIEF_PHASE2, DATA_CONTRACT_PHASE2, FILE_TREE_PHASE2, UI_SPEC_PHASE2
- `APP_FACTORY/` — build playbooks
- `SESSIONS/` — session logs

### Repo-root docs

| File | Purpose |
|------|---------|
| `README.md` | Portfolio-grade entry point |
| `CLAUDE.md` | Claude Code agent instructions |
| `RECOVERY.md` | 3-second recovery state |
| `WINDSURF.md` | Windsurf IDE notes |
| `session_YYYY-MM-DD.md` | Per-day build session logs |

### `supabase/` ⚙️

| File | Purpose |
|------|---------|
| `setup.sql` | RBAC schema migration (enum, `user_roles`, `profiles`, trigger). **NOTE:** does NOT include `subscriptions` table — see `docs/DATABASE_SCHEMA.md § 8`. |

---

## See Also

- `docs/ARCHITECTURE.md § 8` — server/client boundary deep dive
- `docs/DATABASE_SCHEMA.md` — table-by-table reference
- `docs/API_REFERENCE.md` — every API route
- `docs/DEVELOPMENT_GUIDE.md` — recipes for adding files in this structure
