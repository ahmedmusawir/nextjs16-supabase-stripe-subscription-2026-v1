# Architecture

## Factory Standard Overview

This starter kit implements a **database-authoritative RBAC architecture** for Next.js and Supabase.

> **Core principle:** Next.js is the **receptionist**. Postgres with Supabase RLS is the **vault guard**.

That distinction matters.

- **Next.js** decides which route, layout, and UI a user should see.
- **Supabase Auth** establishes identity and session state.
- **Postgres** determines what the user is actually allowed to access.
- **RLS** is the final enforcement layer for data security.

If the UI makes a mistake, the database still refuses unauthorized data access.

---

## The Receptionist vs. Vault Guard Model

### Receptionist: Next.js

Next.js handles the presentation layer:

- Route matching
- Layout composition
- Portal selection
- Navigation flow
- Loading states
- Redirects for unauthorized page access

This is why protected layouts call `protectPage()` before rendering portal content.

Next.js is the first checkpoint, but it is **not** the final source of truth.

### Vault Guard: Supabase + Postgres

Supabase and Postgres handle the actual security boundary:

- User identity comes from Supabase Auth
- Role data lives in the `public.user_roles` table
- Postgres RLS policies inspect the session user via `auth.uid()`
- Data access is approved or denied at the database layer

> A user may be able to request a page, but they should only receive protected rows if the database explicitly allows it.

This is the difference between **UI authorization** and **real security enforcement**.

---

## System Responsibilities

### Next.js Responsibilities

- Render public and protected portals
- Call auth APIs for signup, login, logout
- Refresh layouts after auth state changes
- Read the caller's role via server-side Supabase queries
- Redirect users away from unauthorized portals
- Show loading states during auth transitions

### Supabase Responsibilities

- Create and destroy auth sessions
- Issue access and refresh tokens
- Refresh session state in middleware/proxy
- Persist identity in secure cookies

### Postgres Responsibilities

- Store canonical role assignments in `user_roles`
- Auto-assign the default `member` role for new users
- Enforce data permissions through RLS
- Remain authoritative even if the frontend is manipulated

---

## Request Flow

### 1. Anonymous User Visits the App

1. Request enters Next.js.
2. `proxy.ts` delegates to Supabase session middleware.
3. Supabase refreshes the session if cookies exist.
4. Protected layouts call `protectPage()`.
5. If no authenticated user exists, the layout redirects to `/auth`.

### 2. Authenticated User Requests a Protected Portal

1. Layout calls `protectPage([AppRole.X])`.
2. `protectPage()` gets the current user from Supabase.
3. `getUserRole(user.id)` reads `public.user_roles`.
4. If the user's role is not allowed, Next.js redirects.
5. If allowed, the portal layout renders.

### 3. App Requests Data

1. The UI requests application data.
2. Supabase sends the authenticated user context to Postgres.
3. Postgres RLS policies evaluate `auth.uid()` and role membership.
4. Authorized rows are returned.
5. Unauthorized rows are blocked at the database layer.

---

## Why This Architecture Exists

Traditional starter kits often rely on one or more weak patterns:

- Role flags inside `user_metadata`
- Client-side role checks only
- API-layer authorization without RLS
- Hidden admin UI as the only protection

Those patterns are not sufficient for a production starter.

This starter fixes that by using:

- A dedicated `user_roles` table
- A typed `AppRole` enum in the app layer
- Server-side layout protection
- Database triggers for default membership
- Service-role admin provisioning for privileged user creation
- Postgres RLS for final enforcement

---

## Trust Boundaries

### Trusted

- Supabase Auth session resolution
- Postgres role table
- Postgres RLS policies
- Server-side use of the service role key

### Not Trusted

- Client-side state alone
- Hidden buttons or hidden links
- Browser storage role assumptions
- `user_metadata` role flags

> If a permission model can be bypassed by opening DevTools, it is not a permission model.

---

## App Router Structure

Protected route groups are separated by responsibility:

- `(members)`
- `(admin)`
- `(superadmin)`

Each protected layout performs a server-side role check before rendering children.

This keeps the route contract simple:

- **Layout-level protection** for page access
- **Database-level protection** for data access

---

## Cache Invalidation Model

To avoid stale role/session data after login, signup, logout, or role changes, this starter uses a two-layer invalidation strategy.

### Server-side invalidation

Auth routes call:

```ts
revalidatePath('/', 'layout')
```

This clears Next.js Server Component cache so protected layouts re-run with fresh auth state.

### Client-side invalidation

Auth components call:

```ts
router.refresh()
```

This clears the client Router Cache before routing users to their destination portal.

This combination removes the need for `window.location.reload()` hacks.

---

## Security Summary

This architecture is secure because it assumes the UI can fail.

- Next.js can guide users to the correct portal.
- Supabase can maintain the session.
- Postgres still decides whether data access is legal.

> **Factory Standard rule:** The app may suggest access. The database must approve it.
