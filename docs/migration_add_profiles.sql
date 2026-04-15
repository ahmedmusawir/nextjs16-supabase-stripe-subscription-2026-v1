-- =============================================================================
-- MIGRATION: Add profiles table + Smart Trigger + Superadmin RLS
-- Mark IV — run this if you already have user_roles + app_role enum
-- =============================================================================
-- Safe to run on a live database. Does NOT touch user_roles or its data.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- STEP 1: Create the profiles table
-- -----------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name   text,
  email       text,
  created_at  timestamp with time zone DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


-- -----------------------------------------------------------------------------
-- STEP 2: RLS Policies — fix the superadmin blindspot
-- -----------------------------------------------------------------------------
-- Without these superadmin-aware policies, the dashboard would only ever show
-- the currently logged-in user's own profile row (a blank list for everyone else).

-- Users see their own profile; superadmins see ALL profiles
CREATE POLICY "Profiles are viewable by owner or superadmins"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'superadmin'
  );

-- Users update their own profile; superadmins update ALL profiles
CREATE POLICY "Profiles are updatable by owner or superadmins"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    OR
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'superadmin'
  );


-- -----------------------------------------------------------------------------
-- STEP 3: Backfill profiles for all existing auth users
-- -----------------------------------------------------------------------------
-- Creates a profile row for every user already in auth.users.
-- full_name will be NULL — use the Superadmin Portal Edit form to fill in later.

INSERT INTO public.profiles (id, email, created_at)
SELECT id, email, created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;


-- -----------------------------------------------------------------------------
-- STEP 4: The Smart Trigger
-- -----------------------------------------------------------------------------
-- Reads 'role' and 'full_name' from raw_user_meta_data on new user creation.
-- If no role is provided in metadata, defaults to 'member'.
-- This means addUser can pass the desired role in metadata and the trigger
-- will honour it — no separate role update needed after createUser().

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role public.app_role;
BEGIN
  -- Use metadata role if provided, otherwise default to 'member'
  IF NEW.raw_user_meta_data ->> 'role' IS NOT NULL THEN
    assigned_role := (NEW.raw_user_meta_data ->> 'role')::public.app_role;
  ELSE
    assigned_role := 'member'::public.app_role;
  END IF;

  -- Insert role row (skip if already exists)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role)
  ON CONFLICT (user_id) DO NOTHING;

  -- Insert profile row (reads full_name from metadata)
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;


-- -----------------------------------------------------------------------------
-- STEP 5: Attach the trigger (drops any old version first)
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_assign_member_role ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- =============================================================================
-- Verify with:
--   SELECT p.email, p.full_name, r.role
--   FROM public.profiles p
--   JOIN public.user_roles r ON r.user_id = p.id;
-- You should see one row per user with email + role populated.
-- =============================================================================
