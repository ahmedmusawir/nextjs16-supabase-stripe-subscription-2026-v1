# Database Setup

## Overview

This document is the SQL blueprint for provisioning a fresh Supabase instance for the Pro RBAC starter kit.

> **The complete runnable SQL file is at [`docs/setup.sql`](./setup.sql).**
> Copy its contents and paste into the Supabase SQL Editor. Run top to bottom.

It provisions:

- `app_role` enum
- `public.user_roles` table + RLS
- `public.profiles` table + RLS
- `handle_new_user()` trigger — auto-inserts into **both** `user_roles` and `profiles` on every new signup
- First superadmin promotion instructions

---

## How to Apply

> ### Already have `user_roles` with existing data?
> **Do NOT run `setup.sql`** — it will fail on `CREATE TABLE` and `CREATE TYPE` for things that already exist.
> Run **[`docs/migration_add_profiles.sql`](./migration_add_profiles.sql)** instead.
> It only adds the `profiles` table, backfills existing users, and updates the trigger. Safe to run on a live database.

### Fresh database (no existing tables)

1. Open your Supabase project → **SQL Editor**
2. Open `docs/setup.sql` from this repo
3. Paste the entire file into the editor
4. Click **Run**
5. After it succeeds, promote your first superadmin (see Step 5 below)

---

## Step 1 — Role Enum

```sql
CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'member');
```

---

## Step 2 — `user_roles` Table

Stores the authoritative role for every auth user. This is the canonical source of truth — **not** `user_metadata`.

```sql
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
```

> Write operations (insert/update) are performed by the service role key via the admin client — no user-facing insert policy is needed.

---

## Step 3 — `profiles` Table

Stores the public-facing profile (name, email) for every auth user. Synced automatically by the trigger below.

```sql
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
```

---

## Step 4 — `handle_new_user()` Trigger

Fires automatically on every new auth user creation. Inserts into **both** `user_roles` (default `member`) and `profiles` (email + name from metadata).

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

> **IMPORTANT:** Do NOT manually insert into `user_roles` or `profiles` when creating users via `supabase.auth.admin.createUser()`. This trigger handles it automatically.

---

## Step 5 — Promote the First Superadmin

Every user starts as `member`. The first superadmin must be promoted manually once:

```sql
UPDATE public.user_roles
SET role = 'superadmin'
WHERE user_id = '<your-auth-user-uuid>';
```

Find your UUID in Supabase → **Authentication → Users**.

After this one-time step, all future admins are created through the Superadmin Portal UI.

---

## Step 6 — Role Helper Functions (Optional)

These helpers make RLS policies on domain tables cleaner to read.

```sql
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.get_my_role() = 'superadmin'::public.app_role;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.get_my_role() IN ('admin'::public.app_role, 'superadmin'::public.app_role);
$$;
```

---

## Example Domain Table RLS Pattern

```sql
CREATE TABLE public.projects (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Members see only their own rows
CREATE POLICY "members_read_own_projects"
  ON public.projects FOR SELECT
  USING (owner_user_id = auth.uid());

-- Admins and superadmins see all rows
CREATE POLICY "admins_read_all_projects"
  ON public.projects FOR SELECT
  USING (public.is_admin_or_superadmin());
```

---

## Final Notes

- Keep `SUPABASE_SECRET_KEY` server-only — never expose it to the browser.
- Do not store authorization flags in `user_metadata`.
- Extend RLS to every domain table that matters.
- `public.user_roles` is the canonical authority for role identity.
- `public.profiles` is the canonical source for display name and email in the Superadmin Portal.

> **Factory Standard rule:** The database must be able to defend the product even if the UI is compromised.
