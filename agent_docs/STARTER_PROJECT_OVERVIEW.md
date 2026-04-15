# STARTER PROJECT OVERVIEW

**Project Name:** Stark SaaS Starter (Pro RBAC Next.js Starter Kit)
**Purpose:** Generic onboarding guide for Factory agents working in this starter repository
**Framework:** Next.js 16.2.1 (App Router)
**React Version:** 19.2.4
**Current Version:** v0.4.1 (as of 2026-04-13)

---

## Executive Summary

This starter provides a complete, production-ready foundation for role-based SaaS applications built on Next.js, Supabase SSR authentication, and a shared UI system. It includes three fully implemented portals (Superadmin, Admin, Member), a test suite of 81 tests across 11 suites, and a hardened RBAC system.

The codebase is structured around three main concerns:

- Platform/auth infrastructure (Supabase SSR, RLS, route guards)
- Portal-specific routes and user management features
- Agent workflow and session recovery

---

## Core Auth Flow

### Server-Side Session Management

The authentication model uses Supabase SSR patterns for App Router:

- `src/middleware.ts` — calls `updateSession(request)` on every request
- `src/utils/supabase/middleware.ts` — refreshes session cookies per request
- `src/utils/supabase/server.ts` — anon key server client (respects RLS)
- `src/utils/supabase/admin.ts` — service role client (bypasses ALL RLS — use for admin ops)
- `src/utils/supabase/client.ts` — browser client for client components

### API Endpoints

Authentication routes in `src/app/api/auth/`:

- `login/route.ts`
- `logout/route.ts`
- `signup/route.ts` — public signup, creates member role users, metadata key MUST be `full_name`
- `confirm/route.ts`
- `superadmin-add-user/route.ts`

### Client Auth State

`src/store/useAuthStore.ts` manages:

- Current user + derived role flags
- Authenticated state
- Login/logout actions

---

## RBAC Architecture

### Two-Table Pattern

Roles and profiles are stored in **two sibling tables** — both FK to `auth.users`, with NO direct FK between them:

```sql
public.profiles
  id         uuid PK → auth.users(id) ON DELETE CASCADE
  full_name  text
  email      text
  created_at timestamptz

public.user_roles
  id         uuid PK
  user_id    uuid → auth.users(id) ON DELETE CASCADE
  role       text  -- 'superadmin' | 'admin' | 'member'
```

**Critical:** PostgREST nested selects do NOT work across sibling tables. NEVER use `profiles(user_roles(role))`. Always use the two-query merge pattern (fetch profiles, then fetch roles separately, merge in JS).

### DB Trigger (Mark IV)

`handle_new_user()` fires atomically on every `auth.users` INSERT:
- Reads `full_name` from `raw_user_meta_data`
- Reads `role` from `raw_user_meta_data` — defaults to `'member'` if absent
- Inserts into BOTH `user_roles` AND `profiles`

**Never manually insert into these tables when creating users via `auth.admin.createUser()`.** The trigger handles everything.

### Route Protection

`protectPage(allowedRoles)` in `src/utils/supabase/actions.ts`:
- Reads session via anon client, calls `getUserRole()` from `src/utils/get-user-role.ts`
- Redirects to `/auth` if no session or role mismatch

Protected layouts:
- `(superadmin)/layout.tsx` → `protectPage([AppRole.SUPERADMIN])`
- `(admin)/layout.tsx` → `protectPage([AppRole.ADMIN])`
- `(members)/layout.tsx` → `protectPage([AppRole.MEMBER])`

Roles are defined as an enum in `src/utils/get-user-role.ts`. **RBAC is app-layer enforcement via route guards.** RLS handles data-layer security on `profiles`.

### First Superadmin

Must be promoted manually via SQL (one-time operation):
```sql
UPDATE public.user_roles SET role = 'superadmin' WHERE user_id = '<uuid>';
```
See `docs/DATABASE_SETUP.md` Step 5.

---

## Portal Architecture

### Superadmin Portal — `/superadmin-portal`

**Status:** Complete. Do not modify without a plan.

**Permissions:** Full CRUD on admin + member users. Cannot create/edit/delete other superadmins.

| Route | Description |
|-------|-------------|
| `/superadmin-portal` | Paginated user list (all users except superadmins) |
| `/superadmin-portal/add-user` | Create new admin or member user |
| `/superadmin-portal/edit/[id]` | Edit name and role (admin/member only) |

**Actions** (`actions.ts`): `getUsers`, `getUserById`, `addUser`, `editUser`, `deleteUser`, `toTitleCase`

**Key:** Role dropdown NEVER includes `superadmin` option. If user being edited has `superadmin` role, form defaults to `"admin"`.

### Admin Portal — `/admin-portal`

**Status:** Complete. Do not modify without a plan.

**Permissions:** Can create members, edit names only, delete members only. Cannot edit roles or touch admin/superadmin users for delete.

| Route | Description |
|-------|-------------|
| `/admin-portal` | Paginated user list (admin + member users, no superadmins) |
| `/admin-portal/add-member` | Create new member user |
| `/admin-portal/edit/[id]` | Edit name only (role + email read-only) |
| `/profile` | Admin's own profile — password update |

**Actions** (`actions.ts`): `getUsers`, `getUserById`, `addMember`, `editUser`, `deleteUser`, `toTitleCase`

### Member Portal — `/members-portal`

**Status:** Complete. Do not modify without a plan.

| Route | Description |
|-------|-------------|
| `/members-portal` | Member dashboard |
| `/members-portal/profile` | Own profile — initials avatar, read-only info, password update |

---

## Key Patterns — Read Before Writing Any Code

### Next.js 15 Dynamic Params

Both `params` and `searchParams` must be `Promise<{}>` and awaited:

```ts
interface Props { params: Promise<{ id: string }> }
const Page = async ({ params }: Props) => {
  const { id } = await params;
```

Applies to EVERY dynamic page. Missing `await` → runtime error in production.

### Superadmin DB-Level Filtering (3-Query Pattern)

Superadmins must be excluded at the DB query level — NOT in component JS. JS filtering causes pagination math bugs (count includes superadmins, pages don't → empty page 2).

```ts
// Query 1: get non-superadmin IDs
const { data: allowedRoles } = await adminClient
  .from("user_roles").select("user_id").neq("role", "superadmin");
const allowedIds = allowedRoles.map((r) => r.user_id);

// Query 2: paginated profiles filtered to allowed IDs (count now accurate)
const { data: profiles, count } = await adminClient
  .from("profiles").select("*", { count: "exact" })
  .in("id", allowedIds).order("created_at", { ascending: false }).range(from, to);

// Query 3: roles for this page only
const { data: roleRows } = await adminClient
  .from("user_roles").select("user_id, role").in("user_id", ids);
```

### Shadcn CSS Variables — Do NOT Use

`bg-background`, `bg-popover`, `bg-accent` do NOT resolve to solid colors in this project.

Always use explicit Tailwind classes:
- Dialog/Dropdown: `bg-white dark:bg-slate-800`
- Toast: `bg-white dark:bg-zinc-900`
- Input: `p-6 bg-slate-100 dark:bg-slate-500 dark:text-white`

### Login Error Handling

Use `.catch()` chain on the login promise — NOT `try/catch`. Next.js 15 dev overlay intercepts thrown errors before `try/catch` can process them silently.

### Edit Forms — router.refresh() Before router.push()

```ts
router.refresh();   // bust Next.js router cache
router.push("/admin-portal");
```

Without `router.refresh()`, dashboard shows stale data after redirect.

### Role Color Standards (never deviate)

```
superadmin → text-purple-600 dark:text-purple-400
admin      → text-red-600   dark:text-red-400
member     → text-green-600 dark:text-green-400
```

### toTitleCase Helper

Applied server-side in all actions before writing `full_name` to DB:
```ts
function toTitleCase(name: string): string {
  return name.trim().replace(/\b\w+/g, (word) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
}
```

### PaginationControls — Shared Component

`src/components/common/PaginationControls.tsx` — `useRouter()` + `useTransition()`, shows `Loader2` spinner while pending. Both portals use this. In tests, pagination elements are `role="button"` NOT `role="link"`.

### loading.tsx Placement

Must be INSIDE the portal subdirectory, not at route group level:
- ✅ `(admin)/admin-portal/loading.tsx`
- ❌ `(admin)/loading.tsx` — wraps entire layout including Navbar

### NavigationLoadingProvider — PERMANENTLY DELETED

Was deleted in v0.4.1. Rendered `fixed inset-0 z-[9999] bg-white` on every `<a>` click, covering the Navbar. Do NOT recreate.

---

## Supabase Client Usage

```ts
// Service role (bypasses RLS) — for all portal admin operations
import { createAdminClient } from "@/utils/supabase/admin";

// Anon key (respects RLS) — for own-user operations only
import { createClient } from "@/utils/supabase/server";
const supabase = await createClient();
```

---

## Test Suite

**81 tests, 11 suites, 0 failures** (as of v0.4.1)

Run with: `npm test`

| Suite | Tests |
|-------|-------|
| `actions.test.ts` (protectPage) | 7 |
| `get-user-role.test.ts` | 4 |
| `proxy.test.ts` | 3 |
| `superadmin-add-user.test.ts` | 4 |
| `superadmin/actions.test.ts` | 14 |
| `superadmin/AddUserForm.test.tsx` | 6 |
| `superadmin/EditUserForm.test.tsx` | 6 |
| `superadmin/SuperadminPortalPageContent.test.tsx` | 6 |
| `admin/actions.test.ts` | 11 |
| `admin/AddMemberForm.test.tsx` | 6 |
| `member/ProfileForm.test.tsx` | 8 |

**Ironman Rule:** Do not merge changes that break any test. Fix the test or fix the code — never comment out tests.

---

## File Structure — Key Areas

```
src/app/
  (public)/                           — Home + demo pages
  (auth)/auth/                        — Login + register (AuthTabs)
  (superadmin)/
    layout.tsx                        — protectPage([AppRole.SUPERADMIN])
    superadmin-portal/                — Full CRUD user management
  (admin)/
    layout.tsx                        — protectPage([AppRole.ADMIN])
    admin-portal/                     — Restricted CRUD user management
    profile/                          — Admin's own profile
  (members)/
    layout.tsx                        — protectPage([AppRole.MEMBER])
    members-portal/                   — Member dashboard + profile
  api/auth/                           — Auth API routes

src/components/
  common/PaginationControls.tsx       — Shared pagination with useTransition
  auth/LoginForm.tsx, RegisterForm.tsx
  layout/Sidebar.tsx, AdminSidebar.tsx, SuperadminSidebar.tsx
  global/Navbar.tsx, NavbarSuperadmin.tsx, NavbarHome.tsx

src/utils/
  get-user-role.ts                    — Role lookup from user_roles table
  supabase/server.ts                  — Anon client
  supabase/admin.ts                   — Service role client
  supabase/actions.ts                 — protectPage() guard
  supabase/middleware.ts              — Session refresh

docs/
  DATABASE_SETUP.md                   — Full DB setup (profiles, user_roles, trigger, RLS)
  setup.sql                           — Fresh database SQL
  migration_add_profiles.sql          — Migration for existing databases
  change_logs/                        — v0.2.0 through v0.4.1
```

---

## High-Risk Areas — Extra Care Required

- `src/utils/supabase/server.ts` — session cookie handling
- `src/utils/supabase/middleware.ts` — request-level session refresh
- `src/utils/supabase/actions.ts` — protectPage guard
- `src/utils/get-user-role.ts` — role derivation
- App Router layout guards — any change can break portal access control
- DB trigger `handle_new_user()` — any change affects all user creation flows
- Package upgrades affecting App Router or React hydration

---

## Safe Customization Areas

- Homepage and public marketing copy
- Navbar branding and route labels
- Feature pages inside route groups (new pages, new portals)
- App-specific docs in `agent_docs/`
- New Supabase tables with their own RLS (do not modify existing tables)

---

## Agent Working Rules

1. Read `RECOVERY.md` first — 3-second context recovery
2. Read latest file in `agent_docs/SESSIONS/` — full session history
3. Follow Plan Mode protocol per `CLAUDE.md` — plan → approval → execute
4. Use `createAdminClient()` for portal operations, `createClient()` for own-user operations
5. Preserve auth, RBAC, and route guard infrastructure unless the task explicitly requires changing it
6. Run `npm test` after every implementation — 81/81 must stay green
7. Update `RECOVERY.md` and the session file after every completed task
8. Do NOT add `superadmin` as a selectable role in any form
9. Do NOT use shadcn CSS variables — use explicit Tailwind color classes

---

## Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | ^16.2.1 |
| UI | React | ^19.2.4 |
| Auth/DB | Supabase SSR + supabase-js | ^0.6.1 / ^2.44.0 |
| Forms | React Hook Form + Zod | ^7.51.5 / ^3.23.8 |
| State | Zustand | ^4.5.4 |
| Styling | Tailwind CSS + shadcn/ui | ^3.4.1 |
| Icons | lucide-react | ^0.394.0 |
| Testing | Jest + React Testing Library | ^30.0.5 / ^15.0.0 |
