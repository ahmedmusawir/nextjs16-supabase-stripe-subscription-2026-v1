# StarkReads

> **Subscription-gated content platform.** Next.js 16 (App Router) + Supabase (Auth + Postgres) + Stripe (Subscriptions + Customer Portal).
> Built as a portfolio reference for production-grade subscription architecture.

![tests](https://img.shields.io/badge/tests-136%20passing-brightgreen)
![unit](https://img.shields.io/badge/unit-105-blue)
![integration](https://img.shields.io/badge/integration-13-blue)
![e2e](https://img.shields.io/badge/e2e-18-blue)
![tsc](https://img.shields.io/badge/tsc-clean-brightgreen)
![next](https://img.shields.io/badge/Next.js-16-black)
![ts](https://img.shields.io/badge/TypeScript-5-blue)
![stripe](https://img.shields.io/badge/Stripe-22-635bff)
![supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e)

---

## What this is

StarkReads is a **multi-tier subscription platform** for premium content (think Substack-meets-Medium with strict tier gating). It demonstrates the full lifecycle of a SaaS subscription system:

- A four-tier model (`free` → `starter` → `pro` → `enterprise`) with cumulative access
- Real Stripe Checkout, webhooks, and Customer Portal integration
- Supabase Auth + RLS-protected Postgres tables
- Server/client boundary discipline that lets the entire UI be built before any backend work, then swap in real backends without touching components
- A deliberate four-layer testing strategy (unit + integration + E2E + manual) — **136 tests, all green**

> **Status:** Phase 2 (Backend Integration) complete. Real Stripe + Supabase backends. Test coverage at all layers. Ready for production deploy.

---

## Screenshots

> *Screenshots to be added — placeholder section.*

```
[ Hero / homepage ]
[ Pricing page ]
[ Members portal — Pro tier ]
[ Account page with Stripe Portal button ]
[ Paywall on a Pro article ]
```

---

## Key features

- 🔐 **Auth** — Supabase Auth with cookie-based sessions, RLS-aware queries
- 👮 **RBAC** — `superadmin` / `admin` / `member` roles, enforced via layouts + server actions
- 💳 **Subscriptions** — Stripe-hosted Checkout for first-time, in-place `subscriptions.update` for upgrades (no double-billing)
- 🪝 **Webhooks** — signature verification, idempotent UPSERT, handles 3 critical event types, always returns 200 to prevent Stripe retries
- 🚪 **Tier gating** — `requireSubscriptionTier()` server-side gate; cumulative `meetsTier()` check
- 🛒 **Customer Portal** — full Stripe-hosted billing self-service (payment method, cancellation, invoices)
- ⚡ **Stripe-truth, Supabase-cache pattern** — Stripe owns billing state; Supabase mirrors what the app reads
- 🧪 **Four layers of tests** — pure functions, mocked-SDK integration, real-browser E2E, manual sandbox flow
- 📐 **Server/client boundary** — Turbopack-enforced split between server-only services and client-safe wrappers
- 🌗 **next-themes** light / dark mode

---

## Architecture overview

```
┌──────────────────┐    ┌──────────────────────────────┐    ┌────────────────┐
│      Browser     │    │       Next.js 16 Server       │    │     Stripe     │
│                  │    │                               │    │                │
│  Server Comps    │    │   Pages (Server Components)   │    │  Customers     │
│  + Client Comps  │◀──▶│   + API routes                │◀──▶│  Subscriptions │
│  + Zustand auth  │    │   + Service layer             │    │  Checkout      │
│  store           │    │   + Stripe singleton          │    │  Portal        │
│                  │    │                               │    │  Webhooks ─────┤
└────────┬─────────┘    └───────────────┬───────────────┘    └────────────────┘
         │                              │                              │
         │                              ▼                              │
         │                      ┌────────────────┐                     │
         └─────fetch───────────▶│   Supabase     │◀──────UPSERT───────┘
                                │   Auth + DB    │   (via webhook)
                                │   user_roles   │
                                │   profiles     │
                                │   subscriptions│
                                └────────────────┘
```

For the full architecture, including the **three-system model** (Auth + RBAC + Tiers as orthogonal concerns), data-flow diagrams, and the Stripe-truth/Supabase-cache pattern, see **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)**.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3.4 + Sass |
| UI primitives | ShadCN/UI (Radix) |
| State (client) | Zustand 4 (with `persist`) |
| Forms | React Hook Form + Zod |
| Auth | Supabase Auth (`@supabase/ssr`) |
| Database | Supabase Postgres (RLS) |
| Payments | Stripe 22 (Subscriptions + Customer Portal) |
| Testing (unit/integration) | Jest 30 + ts-jest |
| Testing (E2E) | Playwright 1.59 (Chromium) |
| Theming | next-themes |

---

## Quick start

### Prerequisites

- Node 20+
- A Supabase project (free tier is fine)
- A Stripe account (Test mode)
- The Stripe CLI ([install](https://stripe.com/docs/stripe-cli))

### Install

```bash
git clone <repo-url>
cd nextjs16-supabase-stripe-subscription-2026-v1
npm install
```

### Configure environment

```bash
cp .env.example .env.local       # if .env.example exists; otherwise create from docs/DEPLOYMENT.md § 3
# fill in:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
#   SUPABASE_SECRET_KEY
#   STRIPE_SECRET_KEY
#   STRIPE_WEBHOOK_SECRET
#   STRIPE_PRICE_STARTER / _PRO / _ENTERPRISE
#   NEXT_PUBLIC_SITE_URL
#   NEXT_PUBLIC_API_BASE_URL
```

### Set up Supabase schema

In the Supabase SQL Editor, run **`supabase/setup.sql`** (creates `app_role`, `user_roles`, `profiles`, trigger).

Then create the `subscriptions` table — see **[`docs/DATABASE_SCHEMA.md § 6`](docs/DATABASE_SCHEMA.md#6-migration-sql)**.

Then promote your first user to `superadmin` (instructions at the end of `supabase/setup.sql`).

### Set up Stripe

In Stripe Dashboard (Test mode):
1. Create three Products: `Starter` ($5/mo), `Pro` ($15/mo), `Enterprise` ($49/mo)
2. Copy the Price IDs into `.env.local` as `STRIPE_PRICE_*`
3. Configure the Customer Portal: Settings → Billing → Customer Portal

### Run

```bash
npm run dev                                 # http://localhost:3000

# In a second terminal — only when testing Stripe flows:
./scripts/start_stripe_webhook.sh
# Copy the whsec_… into .env.local as STRIPE_WEBHOOK_SECRET, restart dev
```

### Run tests

```bash
./scripts/run_unit_tests.sh                 # 118 Jest tests, ~3s
./scripts/run_stripe_integration_test.sh    # 13 integration tests, ~0.8s
./scripts/run_e2e_tests.sh                  # 18 Playwright tests, ~40s
```

For deeper instructions, see **[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)**.

---

## Project structure

```
.
├── src/
│   ├── app/                          # App Router pages + API
│   │   ├── (auth)/                   # /auth — login + register
│   │   ├── (public)/                 # / — home, articles, pricing, demo
│   │   ├── (members)/                # /members-portal/* — gated content + account + subscribe success
│   │   ├── (admin)/                  # /admin-portal — admin user CRUD
│   │   ├── (superadmin)/             # /superadmin-portal
│   │   └── api/
│   │       ├── auth/                 # login, signup, logout, confirm, superadmin-add-user
│   │       ├── checkout/             # POST — Stripe Checkout / upgrade
│   │       ├── customer-portal/      # POST — Stripe Billing Portal
│   │       └── webhooks/stripe/      # POST — Stripe webhook receiver
│   ├── components/                   # UI components (ShadCN, articles, subscriptions, layouts)
│   ├── services/                     # subscriptionService, userService, checkoutService, articleService
│   ├── lib/
│   │   ├── tiers.ts                  # meetsTier, tierDisplayName
│   │   ├── auth/requireSubscriptionTier.ts
│   │   ├── stripe/{stripe,tierResolver}.ts
│   │   └── safeRedirect.ts
│   ├── types/                        # SubscriptionTier, TIER_LEVELS, Subscription, Plan, User, Article
│   ├── utils/supabase/               # server.ts, admin.ts, client.ts, middleware.ts
│   └── store/                        # useAuthStore (Zustand)
├── e2e/                              # Playwright specs + helpers
├── scripts/                          # Shell wrappers (run_*_tests.sh, start_stripe_webhook.sh)
├── supabase/
│   └── setup.sql                     # RBAC schema migration
├── docs/                             # Project documentation (this README + 8 deep-dive docs)
├── agent_docs/                       # Factory specs (APP_BRIEF, DATA_CONTRACT, FILE_TREE, UI_SPEC)
└── package.json
```

For every file with one-line purpose + server/client flag, see **[`docs/FILE_REFERENCE.md`](docs/FILE_REFERENCE.md)**.

---

## Testing

136 tests across three automated layers + manual sandbox flow:

| Layer | Tests | Time | Command |
|-------|-------|------|---------|
| Unit (Jest) | 105 | ~2.9s | `./scripts/run_unit_tests.sh` |
| Integration (Jest, mocked SDK) | 13 | ~0.83s | `./scripts/run_stripe_integration_test.sh` |
| E2E (Playwright) | 18 | ~38.5s | `./scripts/run_e2e_tests.sh` |
| **Total** | **136** | **~45s** | (run all) |

**Coverage highlights:**
- All 16 `meetsTier(current, required)` combinations exhaustively tested
- All 3 Stripe routes mocked-tested at integration level (auth paths, validation paths, success paths)
- All 6 webhook events scenarios (sig missing, sig invalid, 3 event handlers, unknown)
- Real-browser tier-hierarchy enforcement (Starter, Pro, Enterprise users)

For the four-layer strategy, mock patterns, and gotchas, see **[`docs/TESTING.md`](docs/TESTING.md)**.

---

## API reference

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/checkout` | POST | Create Stripe Checkout Session OR update existing sub (upgrade) |
| `/api/customer-portal` | POST | Create Stripe Customer Portal session |
| `/api/webhooks/stripe` | POST | Receive + process Stripe webhook events |
| `/api/auth/login` | POST | Email/password login |
| `/api/auth/signup` | POST | User registration |
| `/api/auth/logout` | POST | Logout |
| `/api/auth/confirm` | GET | Email confirmation callback |
| `/api/auth/superadmin-add-user` | POST | Programmatic user creation (superadmin) |

For request/response shapes, error codes, curl examples, and flow diagrams, see **[`docs/API_REFERENCE.md`](docs/API_REFERENCE.md)**.

---

## Deployment

The recommended path is GCP Cloud Run with Secret Manager for sensitive env vars:

1. **Local setup** — `docs/DEPLOYMENT.md § 2`
2. **Stripe Sandbox** — `docs/DEPLOYMENT.md § 4`
3. **Supabase schema** — `docs/DEPLOYMENT.md § 5`
4. **Cloud Run + Dockerfile** — `docs/DEPLOYMENT.md § 6`
5. **Secret Manager mapping** — `docs/DEPLOYMENT.md § 7`
6. **Webhook registration** — `docs/DEPLOYMENT.md § 8`
7. **Post-deploy checklist** — `docs/DEPLOYMENT.md § 9`
8. **Troubleshooting** — `docs/DEPLOYMENT.md § 10`

See **[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)**.

---

## Documentation

| Document | Description |
|----------|-------------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System overview, three-system model, data flows, Stripe-truth/Supabase-cache pattern, server/client boundary, env-var architecture |
| [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md) | All API routes with request/response, error codes, curl examples, flow diagrams |
| [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) | Tables, RLS policies, two-clients pattern, ER diagram, migration SQL, indexes |
| [`docs/SUBSCRIPTION_SYSTEM.md`](docs/SUBSCRIPTION_SYSTEM.md) | Tier model, gate helpers, Stripe object map, checkout/webhook flows, double-sub bug fix history, Phase 3 roadmap |
| [`docs/TESTING.md`](docs/TESTING.md) | Four-layer strategy, coverage matrix, run commands, mock patterns, gotchas |
| [`docs/TESTING_RECON.md`](docs/TESTING_RECON.md) | Architect-level raw inventory and verbatim code samples |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Local + GCP Cloud Run setup, Secret Manager, webhook registration, troubleshooting |
| [`docs/FILE_REFERENCE.md`](docs/FILE_REFERENCE.md) | Every file in the project with purpose + server/client flag |
| [`docs/DEVELOPMENT_GUIDE.md`](docs/DEVELOPMENT_GUIDE.md) | Day-to-day recipes (add tier, gated page, debug webhook, etc.) |

Factory specs and product source-of-truth live in [`agent_docs/`](agent_docs/).

---

## What's next (Phase 3 roadmap)

- 📧 Email notifications on key webhook events (Resend / SendGrid)
- 💸 Dunning + failed payment recovery (handle `invoice.payment_failed`)
- 🎁 Trials (`trial_period_days` on Checkout Session)
- 📅 Annual billing intervals (toggle on PlanCard)
- 🎟️ Coupons + promo codes
- 🏢 Team / multi-user subscriptions (organizations table)
- 📚 Article CMS (replace hardcoded array — Supabase or external)
- 🚨 Webhook delivery monitoring + alerting (audit table + backlog page)

See **[`docs/SUBSCRIPTION_SYSTEM.md § 11`](docs/SUBSCRIPTION_SYSTEM.md#11-whats-deferred-to-phase-3)** for full deferred list.

---

## License

Internal Stark Industries project. License TBD.

---

## Author

**Tony Stark** — Stark Industries / AI App Factory
Built with [Claude Code](https://claude.com/claude-code) under Tony's architectural direction.

> *"Sometimes you gotta run before you can walk."*
