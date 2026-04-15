# Authentication

## Overview

This starter kit uses **Supabase Auth** for identity and session management, while Next.js App Router handles rendering and navigation.

Authentication answers one question:

> **Who is this user?**

It does **not** answer:

> **What is this user allowed to do?**

That second question belongs to authorization and the database role model.

---

## Authentication Stack

The authentication system is built from four parts:

- **Supabase Auth** for user identity and session issuance
- **Next.js API routes** for login, signup, logout, and confirmation flows
- **`proxy.ts`** for request-time session refresh
- **Supabase SSR clients** for server and browser contexts

---

## Core Files

### Browser client

- `src/utils/supabase/client.ts`

Used by client components when they need browser-context Supabase behavior.

### Server client

- `src/utils/supabase/server.ts`

Used in server components, server actions, and route handlers.

This client reads and writes cookies using Next.js server APIs so auth state stays synchronized with SSR rendering.

### Middleware proxy

- `src/proxy.ts`
- `src/utils/supabase/middleware.ts`

This pair refreshes the auth session during requests before protected layouts run.

---

## Session Lifecycle

### 1. Signup

The registration UI posts to:

- `POST /api/auth/signup`

The route calls:

```ts
supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      name,
    },
  },
})
```

After a successful signup:

- Supabase creates the auth user
- user metadata stores a display name only
- a Postgres trigger assigns the default `member` role in `public.user_roles`
- Next.js cache is invalidated with `revalidatePath('/', 'layout')`
- the client calls `router.refresh()` before navigation

### 2. Login

The login UI posts to:

- `POST /api/auth/login`

The route calls:

```ts
supabase.auth.signInWithPassword({ email, password })
```

After successful login:

- Supabase sets session cookies
- the route reads the user's role from `public.user_roles`
- the route invalidates server-side cache
- the client refreshes Router Cache
- the user is sent to the correct portal

### 3. Logout

The logout UI posts to:

- `POST /api/auth/logout`

The route calls:

```ts
supabase.auth.signOut()
```

After successful logout:

- Supabase destroys the session
- the route invalidates server-side cache
- the client refreshes Router Cache
- the user is sent to `/auth`

---

## The `proxy.ts` Session Refresh Loop

### Why it exists

Server-rendered route protection depends on fresh session cookies.

If the session is stale and not refreshed before layouts run, you can get:

- ghost logouts
- inconsistent portal access
- incorrect redirects
- server and browser auth drift

### How it works

`src/proxy.ts` is the App Router middleware entry point:

```ts
import { updateSession } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}
```

It delegates to `updateSession(request)`.

Inside `src/utils/supabase/middleware.ts`:

1. A Supabase server client is created with request cookies.
2. `supabase.auth.getUser()` is called.
3. Supabase refreshes session state if needed.
4. Updated cookies are written back to the response.
5. The request continues into layouts and route handlers.

> This is a session refresh loop, not an authorization engine.

It keeps the request session healthy so server-side auth checks can trust the cookie state.

---

## Why We Do Not Rely on `user_metadata` for Roles

`user_metadata` is useful for profile information.

Examples:

- display name
- avatar preference
- onboarding hints

It is **not** the canonical place for authorization.

### Problems with role flags in `user_metadata`

- It mixes identity profile data with security rules.
- It encourages frontend-driven role logic.
- It is harder to govern with SQL and RLS.
- It creates drift between auth profile state and database truth.

### What we store in `user_metadata`

In this starter, `user_metadata` may contain harmless UX fields such as:

- `name`

### What we do not store there

- `is_admin`
- `is_superadmin`
- `is_member`
- any authorization-critical role assignment

> **Factory Standard rule:** Profile data may live in auth metadata. Authorization must live in the database.

---

## Cache Invalidation After Auth Changes

Next.js aggressively caches App Router output. That is useful for performance, but dangerous if auth state has just changed.

This starter uses both:

### Server-side invalidation

```ts
revalidatePath('/', 'layout')
```

### Client-side invalidation

```ts
router.refresh()
```

This ensures users do not need hard refreshes after:

- signup
- login
- logout
- role changes

---

## Environment Variables

Authentication requires:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_SITE_URL=
```

### Meaning

- `NEXT_PUBLIC_SUPABASE_URL`: your project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: browser/server SSR publishable key
- `SUPABASE_SECRET_KEY`: server-only privileged key for admin provisioning
- `NEXT_PUBLIC_SITE_URL`: used for cookie security decisions and app URL consistency

---

## Authentication Summary

Authentication in this starter is designed to be stable, SSR-safe, and cache-aware.

- Supabase proves identity
- `proxy.ts` keeps the session fresh
- Next.js layouts consume the current session
- auth metadata stores profile info only
- authorization is delegated to database-backed role records

> Authentication tells the app who the user is. Authorization decides what the user can touch.
