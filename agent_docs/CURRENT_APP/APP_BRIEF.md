# APP_BRIEF: StarkReads — Subscription v1 Prototype

> **Version:** 1.2
> **Date:** 2026-04-15
> **Status:** APPROVED
> **App Type:** Full-Stack Web (Frontend Prototype Phase)
> **Built On:** Next.js 16 RBAC Starter Kit v2
> **Author:** Architect (Claude) for Tony Stark
> **Changes from v1.1:** Folded in 4 implementation deviations from Claude Code's pre-build review (route group naming, server-side mock tier propagation via cookie, intent-aware redirect plumbing in auth forms, dual-navbar extension); added security validation rules for `?next=` parameter; added pause-for-sign-off checkpoints.

---

## 1. Hero Statement

We are building a **subscription-gated content platform prototype** on top of the existing RBAC v2 starter kit. The app, codenamed **StarkReads**, simulates a premium tech articles publication where anonymous visitors can browse free content, registered users get a member portal, and paying subscribers unlock tier-gated content (Starter, Pro, or Enterprise).

The purpose of this prototype is **not to build a real publication** — it is to lock down the architectural patterns for layering Stripe subscriptions on top of RBAC, so the same pattern can be cloned and extended for future client work (notably **Project Mothership**).

This is a **frontend-first prototype**. All subscription logic runs against mock data behind a service layer. No real Stripe integration, no real database writes for subscriptions. Once the UI flow is signed off, the backend (Stripe Sandbox + Supabase `subscriptions` table + webhooks) is wired in.

---

## 2. User Persona

| Attribute | Value |
|-----------|-------|
| **Name/Role** | Sarah, a working developer interested in premium tech content |
| **Technical Level** | Semi-technical (familiar with SaaS, has paid for subscriptions before) |
| **Environment** | Desktop browser (primary), mobile browser (secondary) |
| **Primary Goal** | Read high-quality tech articles, upgrade to a paid tier for full access |
| **Pain Point** | Hitting a paywall and needing a frictionless path to subscribe |

**Note:** This persona is illustrative for the prototype. The architectural patterns are domain-agnostic and will carry to Mothership's pharmacy persona unchanged.

---

## 3. App Classification

**Type:** Full-Stack Web App (Prototype Phase — Frontend-First)

**Rationale:** Subscription flows are visual and stateful. Building UI first against mock data validates the user journey before any Stripe or database investment.

**Implications:**
- **UI:** Built with existing starter kit primitives (Page, Row, Box, ShadCN components). No new design system.
- **Data:** Mock data behind service layer. Real Supabase `subscriptions` table is Phase 2.
- **Deployment:** Local dev only for prototype phase. Vercel deployment when backend is wired.

---

## 4. Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Language** | TypeScript | Inherited from starter kit |
| **Frontend** | Next.js 16 (App Router only) | Inherited from starter kit |
| **UI** | Tailwind, ShadCN, common primitives (Page/Row/Box) | Inherited from starter kit, enforces design consistency |
| **State (client)** | Zustand | UI/dev state only (mock tier toggle) |
| **State (server)** | Service layer with mock data | Swap point for real backend later |
| **Mock state propagation** | Cookie + Zustand dual-write | Server reads cookie; client reads store. Mirrors real Supabase session pattern. |
| **Backend (Phase 2)** | Supabase (Postgres + Auth + RLS) | Inherited from starter kit |
| **Payments (Phase 2)** | Stripe Checkout (hosted) + Webhooks | Hosted page — no card form in our app, no PCI exposure |
| **Hosting (Phase 2)** | Vercel | Inherited from starter kit |

**Locked decisions:**
- **Stripe Checkout, not Stripe Elements.** Hosted page, redirect-based. No card form lives in our app.
- **Subscription state is its own system.** Never implemented as roles. Roles and subscriptions are orthogonal.
- **Frontend prototype uses mock data only.** No Stripe Sandbox calls until prototype is signed off.
- **Tier hierarchy is cumulative.** Enterprise > Pro > Starter > Free. Higher tiers always include lower-tier access.
- **Mock tier is propagated server-side via cookie.** Server components and gate helpers cannot read browser-only Zustand state. The dev toggle writes to BOTH a cookie (`dev_mock_tier`) and the Zustand store. This mirrors the real Supabase session-cookie pattern that Phase 2 will use.

---

## 5. Core Features (v1 Scope)

| # | Feature | Priority | Description |
|---|---------|----------|-------------|
| 1 | Public landing page | P0 | Semi-pro home page with hero, free article teasers, pricing CTA |
| 2 | Public articles index | P0 | List of all articles, free + tier-gated clearly marked |
| 3 | Public article detail with paywall | P0 | Free articles fully readable; gated articles show preview + paywall component |
| 4 | Pricing page (3 tiers) | P0 | Three plan cards: Starter ($5), Pro ($15), Enterprise ($49) with "Subscribe" buttons |
| 5 | Mock subscribe flow | P0 | Click "Subscribe" → flips mock state to selected tier (cookie + store) → redirects to success page |
| 6 | Subscribe success page | P0 | Confirmation screen showing selected tier, CTA to relevant content |
| 7 | Tier-aware gate helper | P0 | Server-side `requireSubscriptionTier(tier)` reads tier from cookie, enforces cumulative tier hierarchy |
| 8 | Three tier-gated content pages | P0 | `/members-portal/starter`, `/members-portal/pro`, `/members-portal/enterprise` — each labeled and tier-gated |
| 9 | Account page | P0 | Shows current tier, mocked renewal date, "Manage Subscription" placeholder |
| 10 | Subscription badge in navbar | P0 | "Free" / "Starter" / "Pro" / "Enterprise" badge next to logged-in user's name (authenticated Navbar only) |
| 11 | Intent-aware post-auth redirect | P0 | `?next=` parameter honors user's original destination after registration or subscription. Validated to prevent open-redirect attacks. |
| 12 | Dev tier toggle | P0 | Floating dev-only widget to switch mock tier (Free/Starter/Pro/Enterprise) for testing gating. Writes to cookie AND store. |
| 13 | Tier upgrade CTA on locked content | P0 | When user hits content above their tier, show upgrade CTA pointing at `/pricing` |
| 14 | Auth form `?next=` plumbing | P0 | LoginForm and RegisterForm read `?next=` from URL and redirect to it after success (with validation). Without this, the intent-aware redirect chain is broken end-to-end. |

**Priority Key:**
- **P0** = Required for prototype to demonstrate full subscription flow

---

## 6. Out of Scope (v1)

| Feature | Reason | Planned For |
|---------|--------|-------------|
| Real Stripe integration | Frontend prototype phase — mock only | Phase 2 (next lab) |
| Real Supabase `subscriptions` table | Frontend prototype phase | Phase 2 |
| Subscription cancellation flow | Happy path only | Phase 3 |
| Real upgrade/downgrade transactions | Demo via dev toggle only — no real upgrade UX | Phase 3 |
| Proration logic for mid-cycle upgrades | Stripe-side concern, deferred | Phase 3 |
| Per-tier feature flags beyond content gating | Out of scope — tiers gate content only in v1 | Phase 3 |
| Annual vs monthly billing | Single monthly cadence in v1 | Phase 3 |
| Multi-tenant (org-level) subscriptions | Mothership-specific | Mothership project |
| Webhook handler | Backend phase | Phase 2 |
| Real article CMS / article authoring | Mock article content only | Never — this is a prototype |
| Email notifications | Out of scope for prototype | Phase 3 |
| Payment failure recovery flows | Happy path only | Phase 3 |
| Stripe Customer Portal integration | "Manage Subscription" is placeholder only | Phase 3 |
| Custom Stripe Checkout branding | Default Stripe styling for sandbox | Phase 2+ |

---

## 7. User Flows (High-Level)

### Flow 1: Anonymous Visitor → Reads Free Article
```
Lands on / → Clicks free article → Reads full article → Sees CTA to subscribe
```

### Flow 2: Anonymous Visitor → Hits Gated Article → Registers → Subscribes
```
Lands on / → Clicks Pro-tier article → Sees preview + paywall
  → Clicks "Sign up to read"
  → Redirected to /auth/register?next=/articles/the-article
  → Registers (RegisterForm reads ?next=, validates, auto-login)
  → Lands back on /articles/the-article (default tier: free)
  → Still gated — paywall now shows "Upgrade to Pro" CTA
  → Clicks → /pricing?next=/articles/the-article
  → Selects Pro → Clicks "Subscribe"
  → [MOCK] Sets cookie + store to "pro" → Redirects to /subscribe/success?next=/articles/the-article
  → Clicks "Continue"
  → Lands back on /articles/the-article — full content unlocked
```

### Flow 3: Logged-In Free User → Upgrades to Starter
```
Already logged in (free) → Visits /pricing → Selects Starter → Clicks "Subscribe"
  → [MOCK] Sets cookie + store to "starter" → Redirects to /subscribe/success
  → Starter content now accessible in member portal
  → Pro and Enterprise content still locked with upgrade CTAs
```

### Flow 4: Logged-In Pro User → Browses Tier Content
```
Already logged in (pro) → Lands in /members-portal
  → Sidebar shows "Starter Content" and "Pro Content" sections (cumulative access)
  → "Enterprise Content" still shown but with lock icon
  → Clicks Pro content → reads any pro-tier article
```

### Flow 5: Logged-In User → Views Account
```
/members-portal → /members-portal/account
  → Sees current tier, mocked renewal date
  → "Manage Subscription" button shows "Coming soon" toast
```

### Flow 6: Logged-In Starter User → Tries To Access Pro Content
```
Logged in (starter) → Clicks "Pro Content" link
  → Server-side requireSubscriptionTier('pro') reads cookie → check fails
  → Redirected to /pricing?next=/members-portal/pro
  → Toast: "Upgrade to Pro to access this content"
  → User selects Pro → subscribes → bounces back to /members-portal/pro unlocked
```

---

## 8. System Pipeline / Data Flow

**Frontend Prototype Phase (this lab):**

```
User Action (UI)
    ↓
Service Layer (subscriptionService, articleService)
    ↓
Mock Data (in-memory) + Zustand (client) + Cookie (server-readable)
    ↓
UI re-renders based on mock state
```

**Mock Tier Propagation Detail:**

```
DevTierToggle click
    ↓
1. Sets Zustand store (immediate client UI updates)
    ↓
2. Sets `dev_mock_tier` cookie (server reads on next request)
    ↓
Server components / requireSubscriptionTier() read cookie
Client components read Zustand store
Both stay in sync because writes happen together
```

**Backend Phase (next lab) — preview only:**

```
User Action (UI)
    ↓
Service Layer (UNCHANGED — same interface)
    ↓
Server Route (/api/checkout, /api/webhooks/stripe)
    ↓
Stripe Checkout Session (hosted) → User redirected → Stripe processes payment
    ↓
Webhook fires → Server verifies signature → Writes to Supabase subscriptions table
    ↓
Service layer queries real subscription state (Supabase session cookie replaces dev cookie)
```

**Critical principle:** UI components and service layer interface stay IDENTICAL between phases. Only the service layer's internals swap from mock to real. The cookie pattern carries over (Supabase session cookie replaces `dev_mock_tier` cookie).

---

## 9. Integrations

| System | Type | Purpose | Phase |
|--------|------|---------|-------|
| Stripe Checkout | Hosted Redirect | Payment processing (no card data in our app) | Phase 2 |
| Stripe Webhooks | Server-side handler | Source of truth for subscription state changes | Phase 2 |
| Supabase Auth | SDK | User registration & login | Already integrated (RBAC starter kit) |
| Supabase Postgres | SDK | `subscriptions` table for local mirror of Stripe state | Phase 2 |

**This phase (frontend prototype):** No external integrations. All mock.

---

## 10. Constraints

### Hard Constraints (Non-negotiable)
- Must build on top of RBAC v2 starter kit without modifying its core
- Must use existing UI primitives (Page, Row, Box, ShadCN)
- Subscription state must NEVER be implemented as roles
- Card form must NEVER live in our app (Stripe Checkout hosted only)
- Frontend phase must use mock data only — no real Stripe or DB writes
- Service layer must be the swap point — components never know if data is mock or real
- Tier hierarchy is cumulative and enforced in a SINGLE helper (`requireSubscriptionTier`)
- `?next=` parameter MUST be validated before use — only paths starting with `/`, no `//` or `:` allowed (prevents open-redirect attacks)

### Soft Constraints (Preferences)
- Prefer composition over new components — extend navbars, don't redesign them
- Prefer prescriptive UI_SPEC over visual mockups (no Stitch this round)
- Keep mock data minimal (3 plans, ~6 articles, 1 mock user state)

---

## 11. Risks & Unknowns

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Mock data becomes permanent (forgotten swap to real backend) | High | Low | Service layer pattern enforced; mocks live in `/mocks/` folder for easy deletion |
| Visual inconsistency without Stitch design anchor | Medium | Medium | UI_SPEC is highly prescriptive; reference URLs (Stripe, Linear, Medium) provide vibe anchors |
| Subscription tiers later get implemented as roles by mistake | High | Medium | This brief explicitly forbids it; gate helpers are `requireSubscriptionTier()` not role-based |
| Confusion between "logged-in" and "subscribed" gating | High | Medium | Three distinct helpers: `requireUser()` (existing), `requireRole()` (existing), `requireSubscriptionTier()` (new) |
| Premium paywall logic spreads across components | Medium | Medium | Centralized in single `<Paywall />` component (see Section 19) |
| Tier hierarchy logic gets confused (does Pro include Starter access?) | High | Medium | Tiers are CUMULATIVE. Hierarchy: Enterprise > Pro > Starter > Free. Enforced in single helper. Documented in Access Control Matrix. |
| Dev tier toggle ships to production | High | Low | Store and widget gated behind `process.env.NODE_ENV !== 'production'` check |
| Open-redirect attack via `?next=` parameter | High | Medium | Validate `next` value: must start with `/`, must not contain `//` or `:`. Reject anything else and fall back to default redirect. |
| Mock tier cookie persists into Phase 2 | Low | Low | Phase 2 cleanup checklist explicitly clears `dev_mock_tier` cookie when wiring real auth |
| Cookie/store desync (dev toggle writes to one but not the other) | Medium | Low | DevTierToggle's setMockTier() writes to BOTH atomically — no separate code paths |

### Open Questions
- None blocking for prototype phase. Stripe Sandbox setup details deferred to Phase 2.

---

## 12. Success Criteria

**v1 prototype is successful when:**
- [ ] All 6 user flows are fully navigable end-to-end with mock data
- [ ] Dev tier toggle correctly flips between all four states (Free/Starter/Pro/Enterprise) and gating updates everywhere (server-side AND client-side)
- [ ] Cumulative tier hierarchy works: Enterprise user can access Starter and Pro content; Pro user can access Starter content; Starter user cannot access Pro or Enterprise content
- [ ] Each tier-gated page correctly bounces lower-tier users to `/pricing` with upgrade CTA
- [ ] Paywall component renders correctly for all combinations of (auth state × current tier × required tier)
- [ ] Service layer is the only place that knows about mock vs real (no mock imports in components)
- [ ] Subscription badge in authenticated navbar reflects current tier accurately
- [ ] Intent-aware redirect (`?next=`) works through the full register → subscribe → destination chain
- [ ] `?next=` parameter rejects invalid values (external URLs, protocol-relative URLs) and falls back to default
- [ ] `requireSubscriptionTier()` helper bounces unsubscribed users from gated routes (reads from cookie correctly)
- [ ] All existing RBAC starter kit functionality remains untouched and working (existing tests stay green)
- [ ] Tony can demo the full flow to Coach without backend wired

---

## 13. Build Checkpoints (Sign-Off Gates)

Claude Code MUST pause for Tony's sign-off at these three gates. At each pause, update `RECOVERY.md` at repo root with: **Last action / Pending / Next step.**

| Gate | After Step | What's Done | What Tony Verifies |
|------|------------|-------------|--------------------|
| **Gate 1** | Step 1 (Foundation) | Types, mock data, helpers, dev store, services, gate helper | TypeScript compiles, mock data shapes match contract, no broken imports |
| **Gate 2** | Step 3 (Layout Extensions) | Components built, navbars extended, sidebar extended, dev toggle mounted, auth forms `?next=` enabled | DevTierToggle visible and flips state; navbars show new links; auth forms accept and validate `?next=` |
| **Gate 3** | Step 6 (Final) | All pages built, tier-gating verified | Walk all 6 user flows from Section 7; cumulative hierarchy works; existing tests green |

**Why three gates, not one per step:** Steps 2/4/5 are component/page builds with low blast radius. Steps 1/3/6 are inflection points where bugs would compound. Pause where it matters.

---

## 14. Handoff Checklist

**Ready for build when:**
- [x] Hero statement approved
- [x] User persona confirmed
- [x] App type classified
- [x] Tech stack locked (including cookie + store dual-write)
- [x] P0 features agreed (including auth form ?next= plumbing)
- [x] Out of scope documented
- [x] Route Map defined
- [x] Mock Data Contract defined
- [x] Access Control Matrix defined
- [x] Build checkpoints defined
- [x] Tony signs off on this APP_BRIEF v1.2

---

## 15. Route Map

**Public Routes (no auth required):**

| Route | Purpose | Notes |
|-------|---------|-------|
| `/` | Public landing page | Hero, free article teasers, pricing CTA |
| `/articles` | Public articles index | All articles listed; tier badge on gated ones |
| `/articles/[slug]` | Article detail | Free → full content; gated → preview + paywall |
| `/pricing` | Pricing page | Three tier cards; subscribe buttons |
| `/auth` | Sign in / Register (existing) | Unified auth page with tabs (LoginForm + RegisterForm); `?next=` plumbing ADDED to both forms |

**Authenticated Routes (requires login) — under `(members)` route group:**

| Route | Purpose | Notes |
|-------|---------|-------|
| `/subscribe/success` | Post-subscribe confirmation | Shows selected tier, supports `?next=` |
| `/members-portal` | Member portal home | Existing; sidebar shows tier-conditional sections |
| `/members-portal/account` | Account info | Current tier, renewal date (mocked), manage placeholder |

**Tier-Gated Routes (requires login + specific tier):**

| Route | Required Tier | Purpose |
|-------|---------------|---------|
| `/members-portal/starter` | Starter or higher | "Starter content" labeled page |
| `/members-portal/pro` | Pro or higher | "Pro content" labeled page |
| `/members-portal/enterprise` | Enterprise only | "Enterprise content" labeled page |

**Inherited Routes (untouched by this prototype):**

| Route | Notes |
|-------|-------|
| `/admin-portal/*` | RBAC starter kit — unchanged |
| `/superadmin-portal/*` | RBAC starter kit — unchanged |

**No implicit routes.** If a route is not in this map, it does not exist in v1.

---

## 16. Mock Data Contract (Frontend Phase)

All shapes are TypeScript-style. Real backend types in Phase 2 will mirror these exactly.

**SubscriptionTier (enum):**
```
type SubscriptionTier = "free" | "starter" | "pro" | "enterprise"
```

**Tier hierarchy (constant, used by gate helper):**
```
TIER_LEVELS = { free: 0, starter: 1, pro: 2, enterprise: 3 }
```

**Subscription:**
```
{
  tier: SubscriptionTier
  status: "active" | "none"           // "none" only when tier === "free"
  renewal_date: string | null         // ISO date; null when tier === "free"
  started_at: string | null           // ISO date; null when tier === "free"
}
```

**Plan (for pricing page):**
```
{
  id: string                          // "starter" | "pro" | "enterprise"
  tier: SubscriptionTier              // matches id
  name: string                        // "Starter", "Pro", "Enterprise"
  price_monthly: number               // 5, 15, 49
  description: string
  features: string[]                  // bullet list shown on pricing card
  highlighted: boolean                // true for "recommended" tier (Pro)
}
```

**Article:**
```
{
  id: string
  slug: string                        // URL-safe identifier
  title: string
  excerpt: string                     // 1-2 sentence summary for index page
  required_tier: SubscriptionTier     // "free" = public; otherwise gated
  content_preview: string             // shown above paywall for gated articles
  content_full: string                // full body (markdown or plain string)
  published_at: string                // ISO date
  author: string                      // display name only
}
```

**User (relevant subset for prototype — full user shape inherited from RBAC starter kit):**
```
{
  id: string
  email: string
  role: "superadmin" | "admin" | "member"   // from RBAC; UNTOUCHED
  subscription: Subscription                 // NEW; see above
}
```

**Mock data volume for prototype:**
- 1 user (toggleable subscription state via dev widget)
- 3 plans (Starter, Pro, Enterprise)
- ~6 articles total: 2 free, 2 starter-tier, 1 pro-tier, 1 enterprise-tier

---

## 17. Access Control Matrix

Cumulative tier hierarchy: **Enterprise > Pro > Starter > Free.** A user at a higher tier can always access content gated for lower tiers.

| Route | Requires Login | Required Tier | Behavior If Unauthorized |
|-------|---------------|---------------|--------------------------|
| `/` | ❌ | none | N/A |
| `/articles` | ❌ | none | N/A |
| `/articles/[slug]` (free article) | ❌ | none | N/A |
| `/articles/[slug]` (gated article) | ❌ | conditional* | Show preview + paywall component (friendly mode) |
| `/pricing` | ❌ | none | N/A |
| `/auth` | ❌ | none | N/A |
| `/subscribe/success` | ✅ | none | Redirect to `/auth?next=/subscribe/success` |
| `/members-portal` | ✅ | none | Redirect to `/auth?next=/members-portal` |
| `/members-portal/account` | ✅ | none | Redirect to `/auth?next=...` |
| `/members-portal/starter` | ✅ | starter | Redirect to `/pricing?next=...` with "upgrade required" toast |
| `/members-portal/pro` | ✅ | pro | Redirect to `/pricing?next=...` with "upgrade required" toast |
| `/members-portal/enterprise` | ✅ | enterprise | Redirect to `/pricing?next=...` with "upgrade required" toast |

*\*Gated article behavior:* The article ROUTE is public (so SEO and previews work), but the FULL CONTENT is gated within the page via the Paywall component. Friendly mode — anonymous users see preview, not a forced register wall. See Section 20.

**Three distinct gate helpers — never confuse them:**

- `requireUser()` — inherited from RBAC starter kit. Checks login only.
- `requireRole(role)` — inherited from RBAC starter kit. Checks role membership.
- `requireSubscriptionTier(tier)` — NEW. Reads `dev_mock_tier` cookie (in Phase 2: queries Supabase). Checks tier with cumulative hierarchy.

**These compose. They never replace each other.** A page can require `requireUser()` AND `requireSubscriptionTier('pro')`. A page can require `requireRole('admin')` AND ignore subscription entirely (admins access admin routes regardless of subscription state).

---

## 18. Subscription Ownership

**For v1 prototype:** Subscription is tied to a single USER record. One user, one subscription, one tier.

**Explicitly deferred to future phases:**
- Org-level subscriptions (one subscription covering many users)
- Team seats (subscription with N seat slots)
- Subscription transfers between users
- Multi-tenant billing (relevant for Mothership, NOT v1)

This is called out so that future contributors do not assume multi-tenant is partially built. It is not. The data model treats subscription as a 1:1 with user, and will need refactoring (not patching) to support orgs in Mothership.

---

## 19. Client State Rules (Zustand + Cookie)

Per `STATE_MANAGEMENT_MANUAL.md`:

- **Zustand is for UI and demo state only.** No persistence of business data in stores.
- **No async or network logic in stores.** Stores hold values; service layer fetches them.
- **All data fetching goes through the service layer.** Components → service → (mock or real backend).
- **Stores must expose selectors.** Components use selectors, not direct state access.
- **Mock subscription toggle lives in a dev-only store** (`useDevSubscriptionStore`) AND a cookie (`dev_mock_tier`). The DevTierToggle widget writes to BOTH atomically.

**Why dual-write (cookie + store):**

Server components and gate helpers run before any client JavaScript. They cannot read browser-only Zustand state. The cookie makes the mock tier server-readable. This mirrors the real Phase 2 architecture where Supabase session cookies serve the same purpose.

**Stores in this prototype:**
- `useDevSubscriptionStore` — dev-only mock tier toggle (Free/Starter/Pro/Enterprise) with cookie sync
- (No other new stores required for v1.)

**What stores DO NOT contain:**
- Article data (lives in service layer + mock data files)
- Plan data (lives in service layer + mock data files)
- User profile data (lives in service layer)

---

## 20. Paywall Component Contract

**Component:** `<Paywall />`

**Used in:** `/articles/[slug]` ONLY. (Tier-gated portal routes redirect at the route level — they do NOT use the Paywall component.)

**Inputs (props):**
```
{
  required_tier: SubscriptionTier      // tier needed to unlock
  current_tier: SubscriptionTier       // user's current tier (or "free" if not logged in)
  is_authenticated: boolean            // is the user logged in?
  current_path: string                 // for ?next= chain
}
```

**Behavior:**
- If `current_tier` meets or exceeds `required_tier` (using cumulative hierarchy): component renders nothing (returns `null`). Caller renders full content.
- If `current_tier` is below `required_tier` AND user is not authenticated: render preview block + CTA → "Sign up to read" → links to `/auth/register?next=<current-path>`
- If `current_tier` is below `required_tier` AND user IS authenticated: render preview block + CTA → "Upgrade to [required_tier]" → links to `/pricing?next=<current-path>`

**Visual contract:**
- Renders BELOW the article's `content_preview`
- Single component file, single source of truth for paywall UX
- No paywall logic duplicated in any other component

**Why this matters:** Without this contract, paywall logic spreads across the article detail page, the article cards on the index, and possibly the home page teasers. Centralizing it here prevents that drift.

---

## 21. `?next=` Parameter — Validation Contract

The `?next=` parameter rides through multiple auth steps and MUST be validated before being used as a redirect target.

**Validation rules (enforced in a shared helper, used by LoginForm, RegisterForm, and any other consumer):**

A `next` value is VALID if and only if:
1. It is a non-empty string
2. It starts with `/`
3. It does NOT start with `//` (rejects protocol-relative URLs like `//evil.com`)
4. It does NOT contain `:` (rejects schemed URLs like `javascript:alert()` or `https://evil.com`)
5. It does NOT contain a backslash `\` (defense-in-depth against URL parser quirks)

If `next` fails validation → discard it silently and fall back to the default redirect target for that flow (member portal for register, returning user's last page for login, pricing page for subscribe).

**Implementation location:** `src/lib/safeRedirect.ts` — shared helper used everywhere `?next=` is consumed.

**Why this matters:** Without validation, an attacker can craft a link like `/auth/register?next=https://phish.com` and use the trusted StarkReads domain to launder users into a phishing page. This class of bug is called an **open redirect** and it's a common audit finding.

---

## Appendix A: Visual Anchor

**No Stitch design this round** (prototype is throwaway, starter kit primitives enforce consistency).

**Vibe Reference URLs** (Claude Code can pattern-match against these from training):
- **Pricing page vibe:** `stripe.com/pricing` — clean, confident, three-tier card layout with "recommended" highlight
- **Success page vibe:** `linear.app` post-signup — minimal, celebratory but understated
- **Article paywall vibe:** `medium.com` paywall — premium teaser, clean upgrade CTA
- **Landing page vibe:** `vercel.com` minimal hero — confident product positioning

---

## Appendix B: References

- `FRONTEND_FIRST_PLAYBOOK.md` — Mandatory: build UI first with mock data behind service layer
- `UI-UX-BUILDING-MANUAL.md` — Page/Row/Box primitives, ShadCN component patterns
- `STATE_MANAGEMENT_MANUAL.md` — Zustand for client state only
- `APP_ARCHITECTURE_MANUAL.md` — App Router patterns, route group conventions
- RBAC v2 Starter Kit — Foundation; provides `requireUser()`, `requireRole()`, `user_roles` table

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| **RBAC** | Role-Based Access Control. The starter kit's existing system of `superadmin`/`admin`/`member` roles. |
| **Subscription** | A user's commercial state — what tier they have paid for. Separate from role. |
| **Tier** | A level of subscription access: `free`, `starter`, `pro`, or `enterprise`. |
| **Cumulative Hierarchy** | Higher tiers automatically include access to all lower tiers. Pro > Starter > Free. |
| **Stripe Checkout** | Stripe's hosted payment page. We redirect to it; user pays on Stripe's domain; redirected back. |
| **Stripe Elements** | The embedded form approach (NOT what we're using). Card fields rendered in our app. |
| **Service Layer** | The abstraction that components call. Swaps from mock to real backend without UI changes. |
| **Gate Helper** | A server-side function (`requireUser()`, `requireRole()`, `requireSubscriptionTier()`) that protects routes. |
| **Paywall** | UI component shown to non-subscribers attempting to access gated article content. |
| **Intent-Aware Redirect** | The `?next=` URL parameter pattern that honors user's original destination after auth. |
| **Friendly Mode** | Anonymous users hitting a gated article see a content preview (not a forced register wall). |
| **Open Redirect** | A security vulnerability where a trusted site can be tricked into redirecting users to a malicious external URL. Prevented by `?next=` validation. |
| **Dual-Write** | The pattern of writing the same value to two storage locations atomically (here: cookie + Zustand store) so that both server and client can read it. |

---

**END OF APP_BRIEF v1.2**
