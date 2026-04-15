# Superadmin Portal — Manual Testing Guide

## Pre-flight Checklist

Before starting, confirm all of the following:

- [ ] Dev server is running (`npm run dev`)
- [ ] `docs/migration_add_profiles.sql` has been run in Supabase SQL Editor
- [ ] You have a superadmin account (`role = 'superadmin'` in `public.user_roles`)

---

## PHASE 1 — Database Verification

Run these queries in the **Supabase SQL Editor** before touching the UI.

**1a. Confirm profiles were backfilled:**

```sql
SELECT p.email, p.full_name, r.role
FROM public.profiles p
JOIN public.user_roles r ON r.user_id = p.id;
```

✅ Expected: One row per existing user. Emails populated. `full_name` may be null for old users (fill in via Edit form later).

**1b. Confirm trigger is attached:**

```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

✅ Expected: One row — `on_auth_user_created` / `INSERT` / `users`

---

## PHASE 2 — Dashboard (Read)

1. Go to `http://localhost:3000/auth` and log in as your superadmin
2. Navigate to `http://localhost:3000/superadmin-portal`

✅ Expected:
- Sidebar shows **Dashboard** and **Add User** links
- User cards grid appears with email, name (or —), and role badge
- Your own user card is visible
- **All other users are also visible** — this confirms the superadmin RLS policy is working

❌ If dashboard is blank (only shows your own card or no cards at all): the RLS policy didn't apply. Re-run Step 2 of the migration SQL.

---

## PHASE 3 — Add User

1. Click **Add User** in the sidebar (or the button top-right of the dashboard)
2. Fill in the form:
   - **Name:** `Test Admin User`
   - **Email:** a fresh email you haven't used before
   - **Password:** `Test1234!`
   - **Role:** `Admin`
3. Click **Create User**

✅ Expected:
- Button shows a spinner while submitting
- Toast: *"User created successfully"*
- Redirects back to dashboard
- New user card appears with name, email, and **admin** badge

4. Go to Supabase → Table Editor → `user_roles`

✅ Expected: New row with `role = admin` — **not** `member`. This confirms the smart trigger read the role from metadata correctly.

5. Go to Supabase → Table Editor → `profiles`

✅ Expected: New row with `full_name = Test Admin User` and the correct email.

---

## PHASE 4 — Edit User

1. On the dashboard, click **Edit** on the new user's card
2. Verify the form loads correctly:

✅ Expected:
- Email field is visible but **greyed out and disabled** — cannot be typed in
- Name and Role fields are editable and pre-populated with current values

3. Change the name to `Test Admin Updated` and change role to `Member`
4. Click **Save Changes**

✅ Expected:
- Spinner shows while saving
- Toast: *"User updated successfully"*
- Redirects to dashboard
- Card now shows the updated name and `member` badge

---

## PHASE 5 — Delete User

1. Click **Delete** on the test user's card

✅ Expected: Browser confirm dialog — *"Delete user 'Test Admin Updated'? This cannot be undone."*

2. Click **OK**

✅ Expected:
- Button shows spinner briefly
- Toast: *"User deleted successfully"*
- Card disappears from the dashboard immediately
- Supabase → `profiles` and `user_roles` rows for that user are gone (CASCADE delete from `auth.users`)

---

## PHASE 6 — Pagination

> Only applicable if you have more than 6 users.

1. Check the bottom of the dashboard

✅ Expected:
- **Previous / Next** buttons appear
- URL changes to `?page=2` when clicking Next
- Exactly 6 cards are shown per page

---

## PHASE 7 — Public Signup Trigger Test

This verifies the smart trigger fires correctly for regular users signing up via the public form.

1. Log out and go to `/auth` → Sign Up tab
2. Register a brand new user (name + email + password)

✅ Expected (verify in Supabase Table Editor):
- `user_roles`: new row with `role = member`
- `profiles`: new row with `full_name` populated from the signup form

3. Log back in as superadmin → new user appears on dashboard with `member` badge

---

## Quick Pass/Fail Checklist

| Test | Pass |
|------|------|
| Dashboard shows **all** users (not just self) | ☐ |
| Add User creates with the selected role (not hardcoded `member`) | ☐ |
| `profiles.full_name` is populated on Add User | ☐ |
| Edit User — email field is read-only | ☐ |
| Edit User — name and role update correctly | ☐ |
| Delete User — removes from DB via cascade | ☐ |
| Public signup → both `profiles` and `user_roles` rows created by trigger | ☐ |
| Pagination appears and works at 7+ users | ☐ |

---

## Common Failure Patterns

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Dashboard blank / only shows self | RLS SELECT policy missing or wrong | Re-run Step 2 of migration SQL |
| Add User creates `member` regardless of role selected | Old trigger still active | Re-run Step 4 & 5 of migration SQL |
| `profiles.full_name` is null after Add User | Trigger reading wrong metadata key | Confirm migration SQL ran the `CREATE OR REPLACE FUNCTION` block |
| Edit saves but dashboard doesn't update | `revalidatePath` not firing | Check server action returns no error; hard refresh to confirm |
| Delete shows error toast | User may not exist in `auth.users` | Check Supabase Auth → Users tab |
