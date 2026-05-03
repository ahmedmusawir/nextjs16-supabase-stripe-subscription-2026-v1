# DEPLOYMENT

> **Setup guide for local development and production (GCP Cloud Run).**
> **Last reviewed:** 2026-05-03

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Local Development Setup](#2-local-development-setup)
3. [Environment Variables — Complete List](#3-environment-variables--complete-list)
4. [Stripe Sandbox Setup](#4-stripe-sandbox-setup)
5. [Supabase Schema Setup](#5-supabase-schema-setup)
6. [GCP Cloud Run Deployment](#6-gcp-cloud-run-deployment)
7. [GCP Secret Manager](#7-gcp-secret-manager-setup)
8. [Stripe Webhook Endpoint Registration (Production)](#8-stripe-webhook-endpoint-registration-production)
9. [Post-Deployment Verification Checklist](#9-post-deployment-verification-checklist)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

### Required tools

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org/) or `nvm install 20` |
| npm | bundled with Node | — |
| Stripe CLI | latest | [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli) |
| Supabase CLI | optional but useful | `npm i -g supabase` |
| `gcloud` CLI | latest | [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install) — **only for production deploys** |

### Required accounts

- **Supabase** — free tier works; create at [supabase.com](https://supabase.com)
- **Stripe** — Sandbox account (free); enable Test mode at [stripe.com](https://stripe.com)
- **GCP** (production only) — for Cloud Run + Secret Manager

---

## 2. Local Development Setup

### Step 1: Clone and install

```bash
git clone <repo-url>
cd nextjs16-supabase-stripe-subscription-2026-v1
npm install
```

### Step 2: Set up environment variables

Create `.env.local` at the repo root (it's `.gitignore`d). Populate with the values from § 3.

> ⚠️ **Never commit `.env.local`.** It contains secrets.

### Step 3: Set up Supabase

Follow § 5. Briefly:
1. Create a Supabase project
2. Run `supabase/setup.sql` in the SQL Editor
3. Manually create the `subscriptions` table (see § 5)
4. Promote your user to `superadmin` (see end of `setup.sql`)

### Step 4: Set up Stripe

Follow § 4. Briefly:
1. Create 3 Products (Starter / Pro / Enterprise) in the Stripe Dashboard (Test mode)
2. Note the Price IDs (`price_xxx`)
3. Set them in `.env.local` as `STRIPE_PRICE_STARTER` / `_PRO` / `_ENTERPRISE`

### Step 5: Run dev server

```bash
npm run dev
# Server starts at http://localhost:3000
```

### Step 6: (Optional) Start the Stripe webhook forwarder

In a second terminal:

```bash
./scripts/start_stripe_webhook.sh
# OR: stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

The Stripe CLI prints a webhook signing secret (`whsec_xxx`) on startup. Copy it into `.env.local` as `STRIPE_WEBHOOK_SECRET` and restart the dev server. (You only need to do this when the secret rotates — typically once.)

### Step 7: Run tests

```bash
./scripts/run_unit_tests.sh                  # 105 + 13 = 118 Jest tests, ~3s
./scripts/run_stripe_integration_test.sh     # 13 integration only, ~0.8s
./scripts/run_e2e_tests.sh                   # 18 Playwright tests, ~40s
```

---

## 3. Environment Variables — Complete List

### Public (inlined into browser bundle)

| Variable | Required? | Example | Purpose |
|----------|-----------|---------|---------|
| `NEXT_PUBLIC_SITE_URL` | Yes | `http://localhost:3000` (dev) / `https://yourdomain.com` (prod) | Cookie security flag derivation |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | `http://localhost:3000` | Base URL for legacy posts API |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | `https://<project-ref>.supabase.co` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | `sb_publishable_xxx` | Supabase anon/publishable key — safe in browser |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Reserved | `pk_test_xxx` | Stripe publishable key (currently unused — for future client-side Stripe.js) |

### Server-only (NEVER prefixed with `NEXT_PUBLIC_`)

| Variable | Required? | Example | Purpose |
|----------|-----------|---------|---------|
| `SUPABASE_SECRET_KEY` | Yes | `sb_secret_xxx` | Supabase service-role key — bypasses RLS |
| `STRIPE_SECRET_KEY` | Yes | `sk_test_xxx` (test) / `sk_live_xxx` (live) | Stripe SDK initialization |
| `STRIPE_WEBHOOK_SECRET` | Yes | `whsec_xxx` | Webhook signature verification |
| `STRIPE_PRICE_STARTER` | Yes | `price_xxx` | Maps to `'starter'` tier |
| `STRIPE_PRICE_PRO` | Yes | `price_xxx` | Maps to `'pro'` tier |
| `STRIPE_PRICE_ENTERPRISE` | Yes | `price_xxx` | Maps to `'enterprise'` tier |

### Sample `.env.local` template

```bash
# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_ME
SUPABASE_SECRET_KEY=sb_secret_REPLACE_ME

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_REPLACE_ME
STRIPE_SECRET_KEY=sk_test_REPLACE_ME
STRIPE_WEBHOOK_SECRET=whsec_REPLACE_ME

STRIPE_PRICE_STARTER=price_REPLACE_ME
STRIPE_PRICE_PRO=price_REPLACE_ME
STRIPE_PRICE_ENTERPRISE=price_REPLACE_ME
```

---

## 4. Stripe Sandbox Setup

### Step 1: Create products

In the Stripe Dashboard (Test mode):

1. **Products → Add product**
2. Name: `StarkReads Starter`, Price: `$5.00 USD`, Recurring monthly
3. Repeat for `StarkReads Pro` ($15) and `StarkReads Enterprise` ($49)

### Step 2: Note the Price IDs

After creating each product, click into it and copy the **Price ID** (looks like `price_1Abc...`). You need three Price IDs.

### Step 3: Add to `.env.local`

```
STRIPE_PRICE_STARTER=price_1Abc...
STRIPE_PRICE_PRO=price_2Def...
STRIPE_PRICE_ENTERPRISE=price_3Ghi...
```

### Step 4: Get your Stripe API keys

In the Dashboard, **Developers → API keys**:
- Publishable key (`pk_test_...`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Secret key (`sk_test_...`) → `STRIPE_SECRET_KEY`

### Step 5: Get your webhook signing secret (local dev)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Output: > Ready! Your webhook signing secret is whsec_xxxxx (^C to quit)
```

Copy `whsec_xxxxx` into `.env.local` as `STRIPE_WEBHOOK_SECRET`.

> 💡 The CLI-issued `whsec_*` is **separate from** the production webhook secret you'll register in § 8.

### Step 6: Configure Customer Portal

Stripe → Settings → Billing → Customer Portal:
- Enable plan switching (so users can upgrade via the portal)
- Enable cancellation
- Set `Business information` (name, support email)

---

## 5. Supabase Schema Setup

### Step 1: Create a Supabase project

At [supabase.com/dashboard](https://supabase.com/dashboard) → New Project. Wait ~2 minutes for provisioning.

### Step 2: Run the setup SQL

Open the SQL Editor in your project and paste **the entire contents of `supabase/setup.sql`**, then Run. This creates:
- `app_role` enum
- `user_roles` table + RLS policies
- `profiles` table + RLS policies
- `handle_new_user()` trigger

### Step 3: Create the `subscriptions` table

> ⚠️ The `subscriptions` table is **not in `setup.sql`** at the moment (see `docs/DATABASE_SCHEMA.md § 8`). Use the proposed CREATE TABLE statement from `docs/DATABASE_SCHEMA.md § 6` and run it in the SQL Editor.

```sql
CREATE TABLE public.subscriptions (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id       text,
  stripe_subscription_id   text,
  tier                     text NOT NULL CHECK (tier IN ('starter','pro','enterprise')),
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

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own subscription"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

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

### Step 4: Get Supabase credentials

Project Settings → API:
- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- `anon` public key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `service_role` secret → `SUPABASE_SECRET_KEY` (treat this like a password)

### Step 5: Promote the first superadmin

Register at `/auth` first (so an `auth.users` row exists), then in the Supabase SQL Editor:

```sql
UPDATE public.user_roles
SET role = 'superadmin'
WHERE user_id = '<your-auth-user-uuid>';
```

Find your UUID under Authentication → Users.

---

## 6. GCP Cloud Run Deployment

> Cloud Run is the recommended host. Vercel and other Node hosts also work but are not the documented path here.

### Step 1: Build a container

Create a `Dockerfile` (not currently in repo — recommended addition):

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS build
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
EXPOSE 8080
ENV PORT=8080
CMD ["npm", "start"]
```

### Step 2: Submit a build to Cloud Build

```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/starkreads
```

### Step 3: Deploy to Cloud Run

```bash
gcloud run deploy starkreads \
  --image gcr.io/PROJECT_ID/starkreads \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="STRIPE_SECRET_KEY=starkreads-prod-stripe-secret-key:latest, \
                 SUPABASE_SECRET_KEY=starkreads-prod-supabase-service:latest, \
                 STRIPE_WEBHOOK_SECRET=starkreads-prod-stripe-webhook-sec:latest, \
                 STRIPE_PRICE_STARTER=starkreads-prod-price-starter:latest, \
                 STRIPE_PRICE_PRO=starkreads-prod-price-pro:latest, \
                 STRIPE_PRICE_ENTERPRISE=starkreads-prod-price-enterprise:latest" \
  --set-env-vars="NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co, \
                  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx, \
                  NEXT_PUBLIC_SITE_URL=https://yourdomain.com, \
                  NEXT_PUBLIC_API_BASE_URL=https://yourdomain.com, \
                  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx"
```

> Public env vars are passed as plain values; secret env vars come from Secret Manager. See § 7.

### Step 4: Map a custom domain (optional)

```bash
gcloud run domain-mappings create --service starkreads \
  --domain yourdomain.com --region us-central1
```

Update `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_API_BASE_URL` accordingly and redeploy.

---

## 7. GCP Secret Manager Setup

The recommended pattern: **descriptive Secret Manager names → generic env var names**. Code stays portable; secret names tell ops what they are.

### Step 1: Create secrets

```bash
# In the GCP project:
echo -n "sk_live_xxx" | gcloud secrets create starkreads-prod-stripe-secret-key --data-file=-
echo -n "sb_secret_xxx" | gcloud secrets create starkreads-prod-supabase-service --data-file=-
echo -n "whsec_xxx" | gcloud secrets create starkreads-prod-stripe-webhook-sec --data-file=-
echo -n "price_xxx" | gcloud secrets create starkreads-prod-price-starter --data-file=-
echo -n "price_yyy" | gcloud secrets create starkreads-prod-price-pro --data-file=-
echo -n "price_zzz" | gcloud secrets create starkreads-prod-price-enterprise --data-file=-
```

### Step 2: Grant Cloud Run access

```bash
PROJECT_NUMBER=$(gcloud projects describe PROJECT_ID --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

for SECRET in starkreads-prod-stripe-secret-key \
              starkreads-prod-supabase-service \
              starkreads-prod-stripe-webhook-sec \
              starkreads-prod-price-starter \
              starkreads-prod-price-pro \
              starkreads-prod-price-enterprise; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"
done
```

### Step 3: Mapping table

| Secret Manager name | Cloud Run env var |
|---|---|
| `starkreads-prod-stripe-secret-key` | `STRIPE_SECRET_KEY` |
| `starkreads-prod-supabase-service` | `SUPABASE_SECRET_KEY` |
| `starkreads-prod-stripe-webhook-sec` | `STRIPE_WEBHOOK_SECRET` |
| `starkreads-prod-price-starter` | `STRIPE_PRICE_STARTER` |
| `starkreads-prod-price-pro` | `STRIPE_PRICE_PRO` |
| `starkreads-prod-price-enterprise` | `STRIPE_PRICE_ENTERPRISE` |

### Rotating a secret

```bash
echo -n "new_value" | gcloud secrets versions add starkreads-prod-stripe-secret-key --data-file=-
gcloud run services update starkreads --region us-central1   # picks up :latest
```

---

## 8. Stripe Webhook Endpoint Registration (Production)

Once Cloud Run is deployed at, say, `https://yourdomain.com`:

### Step 1: Add an endpoint in Stripe

Stripe Dashboard → Developers → Webhooks → **Add endpoint**:
- **Endpoint URL:** `https://yourdomain.com/api/webhooks/stripe`
- **Listen to:** `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- (Add more events later as you handle them)

### Step 2: Copy the signing secret

After creating the endpoint, click it and reveal the **Signing secret** (`whsec_xxx`). This is **different from** the local Stripe CLI's `whsec`.

### Step 3: Update Secret Manager + redeploy

```bash
echo -n "whsec_PRODUCTION" | gcloud secrets versions add starkreads-prod-stripe-webhook-sec --data-file=-
gcloud run services update starkreads --region us-central1
```

### Step 4: Test from Stripe

In the webhook detail page, click **Send test webhook** with `checkout.session.completed`. It should return 200 within ~1s. If not, check Cloud Run logs.

---

## 9. Post-Deployment Verification Checklist

Run through this after every production deploy:

- [ ] Health check: `https://yourdomain.com` returns 200 with the homepage
- [ ] Public pages render: `/articles`, `/articles/[free-slug]`, `/pricing`, `/auth`
- [ ] Sign-up flow: register a new test user → lands on `/members-portal`
- [ ] Free user gating: as new user, navigate to `/members-portal/pro` → bounced to `/pricing?next=/members-portal/pro`
- [ ] Checkout (first-time): subscribe to Starter → completes → `/subscribe/success` → redirected through to portal showing Starter access
- [ ] Webhook verified: in Supabase → `subscriptions` table → row appears with correct tier and `status: 'active'`
- [ ] Customer Portal opens: account page "Manage Subscription" → opens Stripe Portal page
- [ ] Tier upgrade: from Stripe Portal, switch Starter → Pro → returns to account page → tier badge updates → `/members-portal/pro` accessible
- [ ] Cancellation: cancel from Portal → webhook sets `status: 'canceled'` → user retains access until period end (or immediately, depending on Portal config)
- [ ] Logs: Cloud Run logs show `[webhook] checkout.session.completed: <user_id> → <tier>` for the test events

---

## 10. Troubleshooting

### "Webhook signature verification failed"

- The `STRIPE_WEBHOOK_SECRET` in your env doesn't match the secret Stripe is signing with.
- **Local dev:** restart `stripe listen` and re-copy the `whsec_*` it prints.
- **Production:** the Webhook endpoint signing secret in the Stripe Dashboard must match Secret Manager.
- **Confusion source:** the local CLI signing secret is **different** from the production endpoint signing secret. Don't mix them up.

### Webhook received but subscription row not updated

Check the Cloud Run / dev server logs:
- `[webhook] No subscription ID in checkout session` → `session.subscription` is null. Confirm the Checkout Session was created with `mode: 'subscription'`.
- `[webhook] Could not resolve tier from price: <id>` → the Price ID isn't in `tierResolver`. Confirm `STRIPE_PRICE_*` env vars are set and match the Stripe Dashboard IDs.
- `[webhook] No supabase_user_id in session metadata` → metadata wasn't set. Confirm the checkout route includes `metadata: { supabase_user_id: user.id, tier }`.
- DB error in upsert: check Supabase logs for RLS or constraint violations.

### "Missing Supabase admin credentials"

`SUPABASE_SECRET_KEY` is unset. In production, check Secret Manager binding. Locally, check `.env.local`.

### Customer Portal returns "No configuration provided"

Stripe requires you to configure the Customer Portal at Stripe Dashboard → Settings → Billing → Customer portal. This is a one-time setup per account.

### DNS / domain not resolving

After running `gcloud run domain-mappings create`, you'll get DNS records to add at your registrar. Propagation can take a few minutes to a few hours.

### Supabase "project paused"

Free tier projects pause after 7 days of inactivity. Reactivate from the Supabase Dashboard. Subscriptions and webhooks will start failing until you do.

### TypeScript build fails on `process.env.X!` non-null assertions

If you've forgotten to set an env var, the runtime will throw on startup but the build will succeed (TypeScript trusts the `!`). Always add new env vars to `.env.local` AND Secret Manager AND your deploy command.

### The `npm run test:integration` command fails with "testPathPattern" error

You're on Jest 30. The flag was renamed to `--testPathPatterns` (plural). Already fixed in `package.json` — pull latest.

### Tests run locally but fail in CI

CI usually doesn't have `.env.local`. Either:
- Use `jest.setup.ts` env defaults (already done — covers Supabase URL/keys for unit tests)
- Skip E2E in CI (recommended) — use unit + integration only
- Or provision a Supabase + Stripe sandbox for CI and inject real test credentials

---

## See Also

- `docs/ARCHITECTURE.md § 9` — env var architecture and naming convention
- `docs/DATABASE_SCHEMA.md` — full schema, including the `subscriptions` table that needs manual creation
- `docs/API_REFERENCE.md` — what each route does in production
- `docs/DEVELOPMENT_GUIDE.md` — day-to-day workflows
