# DEVELOPMENT GUIDE

> **Day-to-day recipes for working on StarkReads.**
> Each recipe is a focused checklist with file paths and code snippets.
> **Last reviewed:** 2026-05-03

---

## Table of Contents

1. [How to Add a New Subscription Tier](#1-how-to-add-a-new-subscription-tier)
2. [How to Add a New Gated Page](#2-how-to-add-a-new-gated-page)
3. [How to Add a New Article](#3-how-to-add-a-new-article)
4. [How to Modify Pricing](#4-how-to-modify-pricing)
5. [How to Test a Change End-to-End](#5-how-to-test-a-change-end-to-end)
6. [How to Debug Webhook Issues](#6-how-to-debug-webhook-issues)
7. [How to Handle a Failed Webhook (Manual Reconciliation)](#7-how-to-handle-a-failed-webhook-manual-reconciliation)
8. [How to Clean Up Test Data](#8-how-to-clean-up-test-data)
9. [Common Workflows with Exact Commands](#9-common-workflows-with-exact-commands)

---

## 1. How to Add a New Subscription Tier

Suppose we want to add a `team` tier between `pro` and `enterprise`.

### Steps

1. **Update tier types** (`src/types/subscription.ts`):
   ```ts
   export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'team' | 'enterprise';

   export const TIER_LEVELS: Record<SubscriptionTier, number> = {
     free: 0,
     starter: 1,
     pro: 2,
     team: 3,
     enterprise: 4,   // bumped from 3
   } as const;
   ```

2. **Create a Stripe Product + Price** for the team tier (Dashboard → Test mode). Note the new `price_xxx`.

3. **Add env var** to `.env.local` AND Secret Manager:
   ```
   STRIPE_PRICE_TEAM=price_xxx
   ```

4. **Wire into the resolver** (`src/lib/stripe/tierResolver.ts`):
   ```ts
   const PRICE_TO_TIER: Record<string, SubscriptionTier> = {
     [process.env.STRIPE_PRICE_STARTER!]: 'starter',
     [process.env.STRIPE_PRICE_PRO!]: 'pro',
     [process.env.STRIPE_PRICE_TEAM!]: 'team',
     [process.env.STRIPE_PRICE_ENTERPRISE!]: 'enterprise',
   };
   ```

5. **Update Supabase CHECK constraint** on `subscriptions.tier`:
   ```sql
   ALTER TABLE public.subscriptions
     DROP CONSTRAINT subscriptions_tier_check;
   ALTER TABLE public.subscriptions
     ADD CONSTRAINT subscriptions_tier_check
       CHECK (tier IN ('starter','pro','team','enterprise'));
   ```

6. **Add a `Plan` to the PLANS array** (`src/services/subscriptionService.ts`):
   ```ts
   {
     id: 'team',
     tier: 'team',
     name: 'Team',
     price_monthly: 29,
     description: 'For small teams collaborating',
     features: ['Everything in Pro', 'Up to 5 team members', 'Shared notes'],
     highlighted: false,
   },
   ```

7. **Add to VALID_TIERS** in `src/app/api/checkout/route.ts`:
   ```ts
   const VALID_TIERS: SubscriptionTier[] = ['starter', 'pro', 'team', 'enterprise'];
   ```

8. **(Optional) Create a gated page** at `src/app/(members)/members-portal/team/` — see § 2.

9. **Update tests:**
   - Extend `src/__tests__/lib/pure-functions.test.ts` `meetsTier` matrix from 16 to 25 combinations
   - Update `e2e/subscription-gating.spec.ts` to add a Team user case if appropriate

10. **Run all tests:**
    ```bash
    ./scripts/run_unit_tests.sh
    ./scripts/run_e2e_tests.sh
    ```

11. **Smoke-test manually** by subscribing to Team via Stripe Sandbox.

---

## 2. How to Add a New Gated Page

Add a new page at `/members-portal/research` that requires `pro`.

### Steps

1. **Create the page directory:**
   ```bash
   mkdir -p src/app/\(members\)/members-portal/research
   ```

2. **Create `page.tsx`** (Server Component, with the gate):
   ```ts
   // src/app/(members)/members-portal/research/page.tsx
   import { requireSubscriptionTier } from '@/lib/auth/requireSubscriptionTier';
   import { ResearchContent } from './ResearchContent';

   export default async function ResearchPage() {
     const user = await requireSubscriptionTier('pro', '/members-portal/research');
     return <ResearchContent user={user} />;
   }
   ```

3. **Create the body component** (can be Server or Client; Server unless you need interactivity):
   ```ts
   // src/app/(members)/members-portal/research/ResearchContent.tsx
   import type { User } from '@/types/user';

   export function ResearchContent({ user }: { user: User }) {
     return (
       <main>
         <h1>Pro Research Vault</h1>
         <p>Welcome, {user.email}.</p>
         {/* … */}
       </main>
     );
   }
   ```

4. **Add a `loading.tsx`** (per CLAUDE.md — every route needs one):
   ```ts
   // src/app/(members)/members-portal/research/loading.tsx
   import { SpinnerLarge } from '@/components/common/SpinnerLarge';

   export default function Loading() {
     return <SpinnerLarge />;
   }
   ```

5. **Add a sidebar/navbar link** if appropriate (`src/components/layout/Sidebar.tsx`).

6. **Test the gate manually:**
   - As a free user, visit `/members-portal/research` → should redirect to `/pricing?next=/members-portal/research`
   - As a pro user, should see the page

7. **(Optional) Add an E2E test** — extend `e2e/subscription-gating.spec.ts` to assert the new page is gated correctly.

---

## 3. How to Add a New Article

Articles are still hardcoded in `src/services/articleService.ts` (CMS deferred to Phase 3).

### Steps

1. **Open `src/services/articleService.ts`** and add a new entry to the `ARTICLES` array:
   ```ts
   {
     id: 7,
     slug: 'distributed-systems-101',
     title: 'Distributed Systems for Application Developers',
     excerpt: 'Why CAP theorem matters even when you think it doesn't.',
     required_tier: 'pro',                  // 'free' | 'starter' | 'pro' | 'enterprise'
     content_preview: 'When you scale beyond one machine, …',
     content_full: '…the full article markdown here…',
     published_at: '2026-05-03T10:00:00Z',
     author: 'Tony Stark',
   },
   ```

2. **Verify it appears:**
   - `/articles` should show the new card
   - `/articles/distributed-systems-101` should render the detail page
   - For free users, the detail page should show the preview + paywall CTA

3. **(Optional) Extend `e2e/public-access.spec.ts`** if the article count assertion needs updating — currently `articles page shows at least 6 articles`.

---

## 4. How to Modify Pricing

Two cases.

### Case A: Change just the displayed price (cosmetic, no Stripe change)

Edit `PLANS` in `src/services/subscriptionService.ts`:
```ts
{
  id: 'pro',
  tier: 'pro',
  name: 'Pro',
  price_monthly: 19,           // ← changed from 15
  // ... rest unchanged
}
```

The pricing card updates immediately. **But Stripe still charges the old price** because the underlying Price ID hasn't changed. This is dangerous — only do this if you've simultaneously updated the Stripe Price.

### Case B: Change the actual charge (proper migration)

Stripe Prices are **immutable** — you can't change a Price's amount. Instead:

1. **Create a new Price** in the Stripe Dashboard (same Product, new amount)
2. **Update the env var** `STRIPE_PRICE_PRO` to the new Price ID
3. **Update `PLANS.price_monthly`** to match the new amount
4. **(Important) Existing subscribers stay on the old Price** until they upgrade or cancel. New subscribers and upgrades use the new Price.
5. **(Optional)** Migrate existing subscribers using `stripe.subscriptions.update()` with `proration_behavior: 'none'` for each.

Always do this in a feature branch and smoke-test the checkout flow before merging.

---

## 5. How to Test a Change End-to-End

### After any change, run the full ladder

```bash
# 1. TypeScript clean?
npx tsc --noEmit

# 2. Unit + integration green?
./scripts/run_unit_tests.sh                  # 118 tests, ~3s

# 3. E2E green?
./scripts/run_e2e_tests.sh                   # 18 tests, ~40s

# 4. Manual sanity check
npm run dev
# Open http://localhost:3000 — walk the relevant user flow
```

### For Stripe-related changes specifically

```bash
# Terminal 1: dev server
npm run dev

# Terminal 2: webhook forwarder
./scripts/start_stripe_webhook.sh
# Copy the whsec_ it prints into .env.local → STRIPE_WEBHOOK_SECRET → restart dev

# Browser: walk the flow
# - register a new user
# - go to /pricing
# - click Subscribe to Pro
# - complete Stripe Checkout (use test card 4242 4242 4242 4242)
# - verify /subscribe/success shows progress then "Welcome to Pro"
# - verify /members-portal/pro is accessible
# - go to /members-portal/account → Manage Subscription → Stripe Portal opens
# - in portal, switch to Enterprise
# - return to /members-portal/account → tier badge updates within ~5s
# - verify /members-portal/enterprise accessible

# In Supabase Table Editor:
# - subscriptions row updated with new tier, new period dates
# - status: 'active'
```

---

## 6. How to Debug Webhook Issues

### Symptom: payment succeeds but `subscriptions` row not updated

**Step 1: confirm Stripe sent the webhook.** In Stripe Dashboard → Developers → Webhooks → click the endpoint → check **Recent events**. Each event should show a 200 response.

**Step 2: confirm the local forwarder is running.** If using Stripe CLI for local dev, `stripe listen` must be running and pointed at `localhost:3000/api/webhooks/stripe`. The CLI prints each forwarded event.

**Step 3: check the dev server / Cloud Run logs.** The webhook handler logs every event:

```
[webhook] checkout.session.completed: user-abc → pro
[webhook] customer.subscription.updated: sub_xyz → pro
[webhook] Unhandled event type: invoice.created
```

If the event is logged but the DB still didn't update, check for error logs:
- `[webhook] Could not resolve tier from price: <id>` → env var mismatch
- `[webhook] No supabase_user_id in session metadata` → checkout route bug
- `[webhook] checkout.session.completed upsert error: <error>` → DB issue (RLS, constraint)

**Step 4: check `STRIPE_WEBHOOK_SECRET` matches.** Local dev uses the CLI's `whsec_*`; production uses the Webhook endpoint's `whsec_*`. Mixing them up causes signature verification failures (400 responses).

**Step 5: replay the event.** In Stripe Dashboard, find the failed event → click **Resend**.

---

## 7. How to Handle a Failed Webhook (Manual Reconciliation)

If a webhook delivery failed and Stripe gave up retrying (after 3 days), the `subscriptions` row in Supabase is out of sync with reality.

### Steps

1. **Find the affected user** — who is the subscription for? Look up their email in Stripe → Customers, then find the matching `auth.users` UUID in Supabase.

2. **Get the current state from Stripe:**
   - Stripe Dashboard → Customers → click the customer → Subscriptions section
   - Note: tier (from product name), status, current_period_end

3. **Check the Supabase row:**
   ```sql
   SELECT * FROM public.subscriptions WHERE user_id = '<uuid>';
   ```

4. **Manually UPDATE to match Stripe:**
   ```sql
   UPDATE public.subscriptions
   SET tier = 'pro',
       status = 'active',
       current_period_end = '2026-06-03T00:00:00Z',
       cancel_at_period_end = false,
       stripe_subscription_id = 'sub_xxx'
   WHERE user_id = '<uuid>';
   ```

5. **Verify the user can now access their tier** by impersonating (or asking them to refresh).

6. **Investigate the webhook failure** — likely a signature mismatch or a code bug. Once fixed, replay or trigger a fresh event to verify the path is healthy.

> **Future improvement:** add a `webhook_events` audit table that logs every received event + processing outcome. Page on backlog.

---

## 8. How to Clean Up Test Data

### In Supabase

After lots of E2E runs, you may have orphaned test users in `auth.users` if cleanup didn't complete. Find them:

```sql
SELECT id, email, created_at FROM auth.users
WHERE email LIKE '%@e2e.test'
ORDER BY created_at DESC
LIMIT 100;
```

Delete them (cascades to `user_roles`, `profiles`, `subscriptions` via FK):

```sql
DELETE FROM auth.users WHERE email LIKE '%@e2e.test';
```

### In Stripe Dashboard (Test mode)

Stripe Test mode customers and subscriptions can pile up. To clean:

1. **Customers:** Stripe → Customers → filter by `email LIKE '%@e2e.test'` → bulk archive
2. **Subscriptions:** Cancel any test subscriptions left over
3. **No charge** — Test mode has no real money

You can also use the Stripe CLI:
```bash
stripe customers list --limit 100 --email-contains '@e2e.test'
# then: stripe customers delete <id> for each
```

> ⚠️ **Never run cleanup against the Live mode key.** Always confirm `sk_test_*` (test) before deleting.

---

## 9. Common Workflows with Exact Commands

### Starting a new feature

```bash
git checkout main
git pull
git checkout -b feature/<short-name>
npm install        # in case dependencies changed
npm run dev        # dev server
# (in another terminal) ./scripts/start_stripe_webhook.sh — if you'll touch Stripe stuff
```

### Before committing

```bash
npx tsc --noEmit                              # type check
./scripts/run_unit_tests.sh                   # 118 tests
./scripts/run_e2e_tests.sh                    # 18 tests (optional but recommended)
git status                                    # review changes
git diff                                      # review code
git add <specific files>                      # NEVER `git add .` blindly
git commit -m "<description>"
```

### Updating dependencies

```bash
npm outdated                                  # see what's drifted
npm install <pkg>@latest                      # update one at a time
./scripts/run_unit_tests.sh                   # confirm nothing broke
./scripts/run_e2e_tests.sh                    # confirm nothing broke
```

### Resetting local Supabase auth state

If you broke the local DB or want to start fresh:
1. Supabase Dashboard → Authentication → Users → delete the test users you've created
2. Or: drop and recreate via Project Settings → General → Pause project (effective wipe)

### Recompiling after changes to env vars

Next.js inlines `NEXT_PUBLIC_*` env vars at build time. After editing `.env.local`:
```bash
# Stop the dev server (Ctrl-C)
npm run dev    # restarts and re-reads .env.local
```

For server-only env vars (`STRIPE_SECRET_KEY` etc.), the dev server picks them up on each request automatically — no restart needed for those alone, but a restart is safe.

### Tailing webhook activity in production

```bash
gcloud run services logs read starkreads --region us-central1 --limit 50 \
  | grep '\[webhook\]'
```

### Connecting to the production DB

```bash
# Get the connection string from Supabase Dashboard → Project Settings → Database
psql 'postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres'

# Then:
\d public.subscriptions
SELECT count(*) FROM public.subscriptions GROUP BY status;
```

---

## See Also

- `docs/ARCHITECTURE.md` — system overview to orient before making changes
- `docs/API_REFERENCE.md` — request/response shapes for the routes you'll touch
- `docs/DATABASE_SCHEMA.md` — table definitions and how to add columns
- `docs/SUBSCRIPTION_SYSTEM.md` — tier mechanics
- `docs/TESTING.md` — how to extend the test suites
- `docs/DEPLOYMENT.md` — how to ship to production
- `CLAUDE.md` — project-wide conventions and Plan Mode protocol
