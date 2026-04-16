# StarkReads

**Subscription-gated content platform prototype** built on Next.js 15, Supabase, and Stripe.

Part of the **AI App Factory** by Stark Industries.

---

## What Is This?

StarkReads is a subscription-based content platform where users pay for tiered access to premium articles. Think Substack meets Medium, with proper tier gating.

**Current state:** Frontend-first prototype with mock data. No live Stripe or Supabase integration yet — everything runs off local mock services and a Zustand dev store for tier switching.

### Live Routes (30 total)

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Hero page with recent articles + pricing teaser |
| `/articles` | Public | Full article index with tier badges |
| `/articles/[slug]` | Public | Article detail with paywall for gated content |
| `/pricing` | Public | 3-column pricing page (Starter / Pro / Enterprise) |
| `/auth` | Public | Login + Register with `?next=` redirect support |
| `/members-portal` | Members | Dashboard with subscription summary |
| `/members-portal/account` | Members | Profile + subscription management |
| `/members-portal/starter` | Starter+ | Starter-tier gated content |
| `/members-portal/pro` | Pro+ | Pro-tier gated content |
| `/members-portal/enterprise` | Enterprise | Enterprise-tier gated content |
| `/subscribe/success` | Members | Post-checkout confirmation with `?next=` |
| `/admin-portal` | Admin | Admin dashboard (from starter kit) |
| `/superadmin-portal` | Superadmin | Superadmin dashboard (from starter kit) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + ShadCN/UI |
| State | Zustand (persisted dev store) |
| Auth | Supabase Auth |
| Database | Supabase (Postgres) |
| Payments | Stripe (planned) |
| Testing | Jest — 81 tests |
| Icons | Lucide React |

---

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Fill in your Supabase keys

# Run dev server
npm run dev

# Run tests
npm test

# Production build
npm run build
```

### Dev Tier Switcher

A floating widget appears in the bottom-right corner during development. Use it to switch between subscription tiers (Free / Starter / Pro / Enterprise) without needing real Stripe integration. State persists across page refreshes via Zustand.

---

## Project Structure

```
src/
  app/
    (public)/          # Public pages — home, articles, pricing
    (auth)/            # Auth pages — login, register
    (members)/         # Member pages — portal, account, tier content, subscribe
    (admin)/           # Admin pages (from starter kit)
    (superadmin)/      # Superadmin pages (from starter kit)
  components/
    articles/          # ArticleCard, Paywall
    subscriptions/     # PlanCard
    common/            # TierBadge, DevTierToggle, SpinnerLarge, Page, Row, Box
    global/            # Navbar, NavbarHome
    layout/            # Sidebar
    auth/              # LoginForm, RegisterForm
    ui/                # ShadCN primitives
  types/               # TypeScript interfaces — subscription, article, user
  mocks/               # Mock data — plans, articles, users
  lib/                 # Helpers — tiers, safeRedirect, requireSubscriptionTier
  store/               # Zustand stores
  services/            # Mock service layer — subscription, article, user
```

---

## Subscription Tiers

| Tier | Price | Access |
|------|-------|--------|
| Free | $0 | Public articles only |
| Starter | $9/mo | Starter content + all free content |
| Pro | $29/mo | Pro + Starter content |
| Enterprise | $99/mo | Everything |

Tier gating uses cumulative access — higher tiers include all lower-tier content. Enforced via `meetsTier()` in `src/lib/tiers.ts` and `requireSubscriptionTier()` server-side gate.

---

## Documentation

| Doc | Location | Description |
|-----|----------|-------------|
| Changelogs | [`docs/change_logs/`](docs/change_logs/) | Dated changelog files for every session |
| Starter Kit Docs | [`docs/STARTER KIT DOCS/`](docs/STARTER%20KIT%20DOCS/) | Architecture, auth, authorization, database, testing |
| App Specs | [`agent_docs/CURRENT_APP/`](agent_docs/CURRENT_APP/) | APP_BRIEF, DATA_CONTRACT, FILE_TREE, UI_SPEC |
| Factory Playbooks | [`agent_docs/APP_FACTORY/`](agent_docs/APP_FACTORY/) | Build playbooks and manuals |
| Session Logs | Project root | `session_YYYY-MM-DD.md` — detailed build logs |
| Recovery State | [`RECOVERY.md`](RECOVERY.md) | 3-second context recovery doc |

### Changelogs

- [2026-04-15](docs/change_logs/changelog_2026-04-15.md) — Full prototype build (Gates 1-3): types, mocks, services, components, all pages
- [2026-04-16](docs/change_logs/changelog_2026-04-16.md) — Loading spinners + button styling polish

---

## Build Status

| Check | Status |
|-------|--------|
| TypeScript | Clean |
| Tests | 81/81 passing |
| Build | Clean — 30 routes |
| Loading States | 20/20 routes covered |

---

## What's Next

- [ ] Stripe integration (real checkout flow)
- [ ] Supabase subscription table + RLS policies
- [ ] Real article CMS (replace mock data)
- [ ] Test coverage for StarkReads features
- [ ] Email notifications on subscription events

---

*Built with the AI App Factory pipeline. Powered by Claude Code.*
