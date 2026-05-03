# DATABASE SCHEMA

> **Database:** Supabase Postgres
> **Schemas:** `auth` (Supabase-managed), `public` (application-owned)
> **Last reviewed:** 2026-05-03

---

## Table of Contents

1. [Overview & ER Diagram](#1-overview--er-diagram)
2. [Tables](#2-tables)
   - [2.1 `auth.users` (Supabase-managed)](#21-authusers-supabase-managed)
   - [2.2 `public.user_roles`](#22-publicuser_roles)
   - [2.3 `public.profiles`](#23-publicprofiles)
   - [2.4 `public.subscriptions`](#24-publicsubscriptions)
3. [Triggers](#3-triggers)
4. [RLS Policies — Plain English](#4-rls-policies--plain-english)
5. [The Two Supabase Clients](#5-the-two-supabase-clients-user-vs-admin)
6. [Migration SQL](#6-migration-sql)
7. [Index Strategy](#7-index-strategy)
8. [Schema Gap & Follow-Up](#8-schema-gap--follow-up)

---

## 1. Overview & ER Diagram

The application has **three custom tables** in the `public` schema, all keyed off `auth.users.id`:

```mermaid
erDiagram
  auth_users ||--|| user_roles    : "1-to-1 (trigger)"
  auth_users ||--|| profiles      : "1-to-1 (trigger)"
  auth_users ||--o| subscriptions : "0-or-1 (created on first checkout)"

  auth_users {
    uuid id PK
    text email
    jsonb raw_user_meta_data
    timestamptz created_at
  }

  user_roles {
    bigint id PK
    uuid user_id FK "UNIQUE, ON DELETE CASCADE"
    app_role role "default 'member'"
    timestamptz created_at
  }

  profiles {
    uuid id PK_FK "ON DELETE CASCADE"
    text full_name
    text email
    timestamptz created_at
  }

  subscriptions {
    uuid id PK
    uuid user_id FK "UNIQUE, ON DELETE CASCADE"
    text stripe_customer_id
    text stripe_subscription_id "UNIQUE"
    text tier "CHECK starter/pro/enterprise"
    text status "CHECK active/canceled/past_due/incomplete/trialing/unpaid"
    timestamptz current_period_start
    timestamptz current_period_end
    bool cancel_at_period_end "default false"
    timestamptz created_at
    timestamptz updated_at
  }
```

**Key facts:**
- Every `auth.users` row triggers creation of `user_roles` + `profiles` rows (default role `'member'`).
- A `subscriptions` row is created **only when a user first attempts checkout** (in `/api/checkout/route.ts`). Free users have **no subscriptions row** — the application code defaults them to `{ tier: 'free', status: 'none' }`.
- `ON DELETE CASCADE` on all FKs means deleting an auth user deletes everything else automatically.

---

## 2. Tables

### 2.1 `auth.users` (Supabase-managed)

The Supabase Auth schema provides this table. We do **not** modify it directly. We reference its `id` as a foreign key in all custom tables.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | PK |
| `email` | `text` | Unique, validated by Supabase Auth |
| `raw_user_meta_data` | `jsonb` | Read by `handle_new_user()` for `full_name` |
| ... | ... | (many other Supabase-managed columns we don't read) |

### 2.2 `public.user_roles`

The **canonical authorization table**. The source of truth for user role — NOT user metadata.

| Column | Type | Constraints | Purpose |
|--------|------|------------|---------|
| `id` | `bigint` | PK, identity | Auto-generated row ID |
| `user_id` | `uuid` | NOT NULL, FK to `auth.users(id)` ON DELETE CASCADE, UNIQUE | One row per user |
| `role` | `public.app_role` | NOT NULL, default `'member'` | Enum: `superadmin`, `admin`, `member` |
| `created_at` | `timestamptz` | default `now()` | Audit |

**Enum definition:**
```sql
CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'member');
```

**Why a separate table (not user metadata):** user metadata is editable from the client. A separate RLS-protected table where users can only **read** their own role — and only the service role can **write** — prevents privilege escalation.

### 2.3 `public.profiles`

Public-facing user profile. Auto-synced from auth.users via trigger.

| Column | Type | Constraints | Purpose |
|--------|------|------------|---------|
| `id` | `uuid` | PK, FK to `auth.users(id)` ON DELETE CASCADE | Same UUID as auth user |
| `full_name` | `text` | nullable | Display name from `raw_user_meta_data.name` |
| `email` | `text` | nullable | Cached from `auth.users.email` |
| `created_at` | `timestamptz` | default `now()` | Audit |

### 2.4 `public.subscriptions`

The **Supabase-side cache of Stripe subscription state** (see `docs/ARCHITECTURE.md § 5`).

| Column | Type | Constraints | Purpose |
|--------|------|------------|---------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Synthetic row ID (not used in app code; queries are by `user_id`) |
| `user_id` | `uuid` | NOT NULL, FK to `auth.users(id)` ON DELETE CASCADE, UNIQUE | One subscription per user — upsert key |
| `stripe_customer_id` | `text` | nullable until first checkout | Stripe Customer ID (`cus_xxx`) |
| `stripe_subscription_id` | `text` | UNIQUE, nullable until checkout completes | Stripe Subscription ID (`sub_xxx`) |
| `tier` | `text` | NOT NULL, CHECK ∈ `('starter','pro','enterprise')` | App tier — note `'free'` is NOT in the constraint (free = no row) |
| `status` | `text` | NOT NULL, default `'active'`, CHECK ∈ `('active','canceled','past_due','incomplete','trialing','unpaid')` | Stripe subscription status |
| `current_period_start` | `timestamptz` | nullable | From `subscription.items.data[0].current_period_start` (NOT subscription root — Stripe v22 change) |
| `current_period_end` | `timestamptz` | nullable | Same — used as `renewal_date` in app code |
| `cancel_at_period_end` | `boolean` | default `false` | Stripe cancel-at-end flag |
| `created_at` | `timestamptz` | default `now()` | Audit |
| `updated_at` | `timestamptz` | default `now()` | Auto-updated by trigger (per `DATA_CONTRACT_PHASE2.md`) |

**Indexes:** `(user_id)` and `(stripe_subscription_id)` — see § 7.

**RLS:** users can SELECT their own row only. All writes go through the service-role admin client.

**Where it's read/written from in code:**

| Operation | File | Line | Purpose |
|-----------|------|------|---------|
| SELECT | `src/services/subscriptionService.ts` | `getCurrentSubscription()` | Resolve current user's tier |
| SELECT | `src/services/userService.ts` | `getCurrentUser()` | Build the `User.subscription` field |
| SELECT | `src/app/api/checkout/route.ts` | line 40 | Look up existing customer/sub before checkout |
| SELECT | `src/app/api/customer-portal/route.ts` | line 18 | Look up `stripe_customer_id` for portal session |
| UPSERT | `src/app/api/checkout/route.ts` | line 79 | Insert placeholder row on first checkout |
| UPSERT | `src/app/api/webhooks/stripe/route.ts` | line 58 | `checkout.session.completed` handler |
| UPDATE | `src/app/api/webhooks/stripe/route.ts` | line 91 | `customer.subscription.updated` handler |
| UPDATE | `src/app/api/webhooks/stripe/route.ts` | line 113 | `customer.subscription.deleted` handler |

---

## 3. Triggers

### 3.1 `handle_new_user()` (`AFTER INSERT ON auth.users`)

Defined in `supabase/setup.sql`. Fires on every new auth user creation. Performs:

1. INSERT into `public.user_roles` with default role `'member'`
2. INSERT into `public.profiles` with `id` (= auth user id), `email`, and `full_name` (from `raw_user_meta_data.name`)

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'name'
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**Implication:** when creating users via the admin API (`supabase.auth.admin.createUser()`), do **NOT** also INSERT into `user_roles` or `profiles` manually. The trigger does it. Doing both causes a unique-constraint violation.

### 3.2 `subscriptions.updated_at` auto-update trigger

Per `DATA_CONTRACT_PHASE2.md` the `subscriptions` table has an auto-update trigger on `updated_at`. The trigger SQL is **not in `supabase/setup.sql`** (see § 8). The trigger ensures `updated_at = now()` on every UPDATE without app code needing to set it.

---

## 4. RLS Policies — Plain English

Row-Level Security is **enabled** on all three custom tables. Below is what each policy allows.

### `public.user_roles`

| Operation | Who can do it | Why |
|-----------|---------------|-----|
| SELECT | Authenticated user, **own row only** (`auth.uid() = user_id`) | Reading own role is needed for client-side gates |
| INSERT / UPDATE / DELETE | **Service role only** (no policy granted to users) | Role assignment is a privileged operation — only superadmin via `/api/auth/superadmin-add-user` (which uses the admin client) can change roles |

### `public.profiles`

| Operation | Who can do it | Why |
|-----------|---------------|-----|
| SELECT | Authenticated user, **own row only** (`auth.uid() = id`) | Account page reads own profile |
| UPDATE | Authenticated user, **own row only** (`auth.uid() = id`) | User can edit their own name |
| INSERT | **Trigger only** (no user policy) | Profiles are auto-created by `handle_new_user()` |
| DELETE | **No one directly** — cascades from `auth.users` deletion | Account deletion goes through Supabase Auth |

### `public.subscriptions`

| Operation | Who can do it | Why |
|-----------|---------------|-----|
| SELECT | Authenticated user, **own row only** (`auth.uid() = user_id`) | Members portal reads own subscription |
| INSERT / UPDATE / DELETE | **Service role only** | All writes happen via webhook handler or checkout route, both of which use the admin client |

> The exact CREATE POLICY statement for `subscriptions` is **not in `supabase/setup.sql`** — see § 8.

---

## 5. The Two Supabase Clients (User vs Admin)

The app uses two distinct Supabase clients with very different privileges. **Choosing the wrong one is a security issue.**

### User client (`src/utils/supabase/server.ts`)

```ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { /* read/write from next/headers */ } }
  )
}
```

| Aspect | Detail |
|--------|--------|
| Key used | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (anon key) |
| Identity | Authenticated as the calling user via session cookie |
| RLS | **Enforced** — sees only what the user is allowed to see |
| Use for | Any read on behalf of the user; auth.getUser(); any write the user themselves should perform |

### Browser client (`src/utils/supabase/client.ts`)

Same publishable key, runs in the browser. Used for client-side reads/auth state hydration.

### Admin client (`src/utils/supabase/admin.ts`)

```ts
import { createClient } from '@supabase/supabase-js'

export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase admin credentials')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}
```

| Aspect | Detail |
|--------|--------|
| Key used | `SUPABASE_SECRET_KEY` (service role key) |
| Identity | None — operates as super-user |
| RLS | **Bypassed** — sees and modifies everything |
| Use for | Webhook handlers (no session cookie), privileged operations (create user + role + sub on behalf of system) |

**The header comment in `admin.ts` is the rule:**

> **CRITICAL: This file uses the service_role key and MUST ONLY be imported in server-side code. NEVER import this in client components or expose the service_role key to the browser.**

### When to use which

| Operation | Client to use |
|-----------|---------------|
| Reading the current user's own subscription / role / profile | User client |
| Updating the current user's own profile | User client |
| Webhook handler writing subscription state for any user | Admin client |
| Checkout route looking up any user's subscription | Admin client |
| Superadmin creating a user / changing a role | Admin client |
| Anything where the operation is "the system acting on behalf of the user" | Admin client |
| Anything where the operation is "the user acting on themselves" | User client |

---

## 6. Migration SQL

The full schema definition for `auth_role` enum, `user_roles`, `profiles`, and the `handle_new_user` trigger lives in **`supabase/setup.sql`**. Run it once in the Supabase SQL Editor (top to bottom).

### `supabase/setup.sql` (verbatim)

```sql
-- =============================================================================
-- Pro RBAC Next.js Starter Kit — Supabase Database Setup
-- =============================================================================

-- STEP 1: AppRole enum
CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'member');

-- STEP 2: user_roles table
CREATE TABLE public.user_roles (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role       public.app_role NOT NULL DEFAULT 'member',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- STEP 3: profiles table
CREATE TABLE public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name   text,
  email       text,
  created_at  timestamp with time zone DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- STEP 4: handle_new_user() trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'name'
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- STEP 5: Promote first superadmin
-- After running this file, manually promote the first superadmin:
--   UPDATE public.user_roles
--   SET role = 'superadmin'
--   WHERE user_id = '<your-auth-user-uuid>';
```

### Reconstructed SQL for `subscriptions` (PROPOSED — see § 8)

The `subscriptions` table was created manually in the Supabase Table Editor and **its CREATE TABLE is not currently in `supabase/setup.sql`**. The following is a reconstruction from `agent_docs/CURRENT_APP/PHASE_2_BACKEND/DATA_CONTRACT_PHASE2.md` and the actual code that reads/writes the table:

```sql
-- ==========================================================================
-- PROPOSED — to be appended to supabase/setup.sql after verification
--           against the live database via the Supabase Table Editor
-- ==========================================================================

CREATE TABLE public.subscriptions (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id       text,
  stripe_subscription_id   text,
  tier                     text NOT NULL CHECK (tier IN ('starter', 'pro', 'enterprise')),
  status                   text NOT NULL DEFAULT 'active'
                                CHECK (status IN ('active','canceled','past_due','incomplete','trialing','unpaid')),
  current_period_start     timestamptz,
  current_period_end       timestamptz,
  cancel_at_period_end     boolean DEFAULT FALSE,
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now(),
  UNIQUE (user_id),
  UNIQUE (stripe_subscription_id)
);

CREATE INDEX idx_subscriptions_user_id          ON public.subscriptions (user_id);
CREATE INDEX idx_subscriptions_stripe_sub_id    ON public.subscriptions (stripe_subscription_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own subscription"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_subscription_updated()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_subscription_updated
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_subscription_updated();
```

---

## 7. Index Strategy

| Index | Table | Column(s) | Purpose |
|-------|-------|-----------|---------|
| (PK auto) | `user_roles` | `id` | Primary key |
| (UNIQUE auto) | `user_roles` | `user_id` | Enforces one role per user; also fast point lookup by `getUserRole(userId)` |
| (PK auto) | `profiles` | `id` | Primary key (= auth user id) — fast lookup |
| (PK auto) | `subscriptions` | `id` | Primary key |
| (UNIQUE auto) | `subscriptions` | `user_id` | Enforces one sub per user; supports the **most frequent query** — `WHERE user_id = ?` (every page load that gates) |
| (UNIQUE auto) | `subscriptions` | `stripe_subscription_id` | Webhook handler queries by Stripe sub ID for `customer.subscription.updated` and `.deleted` |
| `idx_subscriptions_user_id` | `subscriptions` | `user_id` | Redundant with the UNIQUE constraint's index — harmless but kept per `DATA_CONTRACT` |
| `idx_subscriptions_stripe_sub_id` | `subscriptions` | `stripe_subscription_id` | Same — redundant with UNIQUE but kept |

**Note:** Postgres automatically creates a B-tree index for every UNIQUE constraint. The two explicit `idx_*` indexes in the reconstructed SQL above are technically redundant. They're listed in `DATA_CONTRACT_PHASE2.md` and kept for explicitness; they could be dropped without performance impact.

---

## 8. Schema Gap & Follow-Up

### What's missing from `supabase/setup.sql`

The setup SQL file in the repo defines **only the RBAC starter kit schema** (`app_role` enum, `user_roles`, `profiles`, `handle_new_user()` trigger). It does **NOT** include:

- `public.subscriptions` table
- Indexes on `subscriptions`
- RLS policy on `subscriptions`
- The `updated_at` trigger on `subscriptions`

These were created manually in the Supabase Table Editor (per `DATA_CONTRACT_PHASE2.md` line 34: "Already created manually. Documented here for Claude Code's reference.").

### Why this matters

- A fresh Supabase project provisioned by running only `setup.sql` would be **missing the `subscriptions` table**, and the app would fail at runtime
- The reconstructed SQL in § 6 should be appended to `setup.sql` after **verification against the live database** (compare exact column types, default values, and constraint names via the Supabase Table Editor or `pg_dump --schema-only`)
- Recommended follow-up:
  1. Connect to the live Supabase DB and `\d public.subscriptions` to dump the actual definition
  2. Reconcile any differences with the reconstruction in § 6
  3. Append the reconciled SQL to `supabase/setup.sql` under a new `STEP 6` section
  4. Update `DATA_CONTRACT_PHASE2.md` to remove the "already created manually" note

---

## See Also

- `docs/ARCHITECTURE.md § 5` — the Stripe-truth/Supabase-cache pattern
- `docs/SUBSCRIPTION_SYSTEM.md` — how the `subscriptions` rows are produced and consumed
- `docs/API_REFERENCE.md` — the routes that write to `subscriptions`
- `agent_docs/CURRENT_APP/PHASE_2_BACKEND/DATA_CONTRACT_PHASE2.md` — original schema spec
