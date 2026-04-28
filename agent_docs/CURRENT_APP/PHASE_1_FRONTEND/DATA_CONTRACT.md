# DATA_CONTRACT: StarkReads — Subscription v1 Prototype

> **Version:** 1.0
> **Date:** 2026-04-15
> **Status:** DRAFT
> **Inherits From:** APP_BRIEF v1.1 (Section 15 Mock Data Contract)
> **Phase:** Frontend Prototype (Mock Data Only)
> **Author:** Architect (Claude) for Tony Stark

---

## Purpose

This document defines **every type, every service method signature, and every mock data shape** required for the prototype. It is the source of truth that the UI binds to. Components and pages may NEVER invent fields outside this contract.

When backend (Phase 2) replaces mocks, the types defined here remain unchanged — only the service layer's internals swap from mock to real Supabase queries.

---

## 1. File Locations (Canonical)

```
src/
├── types/
│   ├── subscription.ts        # SubscriptionTier, Subscription, Plan, TIER_LEVELS
│   ├── article.ts             # Article
│   └── user.ts                # User (extends RBAC starter kit user)
├── services/
│   ├── subscriptionService.ts # All subscription operations
│   ├── articleService.ts      # All article operations
│   └── userService.ts         # User profile + subscription join
├── mocks/
│   ├── data/
│   │   ├── plans.ts           # 3 plan objects
│   │   ├── articles.ts        # 6 article objects
│   │   └── users.ts           # 1 mock user
│   └── README.md              # "DELETE THIS FOLDER WHEN BACKEND IS WIRED"
├── lib/
│   ├── tiers.ts               # Tier hierarchy logic, comparison helpers
│   └── auth/
│       └── requireSubscriptionTier.ts  # NEW gate helper
└── store/
    └── useDevSubscriptionStore.ts      # Dev-only mock tier toggle
```

**Rules:**
- All types live in `src/types/` — never inline in components
- All data access goes through `src/services/` — components never import from `src/mocks/`
- `src/mocks/` is the disposable folder — entire folder deleted in Phase 2

---

## 2. Type Definitions

### 2.1 SubscriptionTier (enum)

```typescript
// src/types/subscription.ts

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'enterprise';
```

**Notes:**
- Lowercase string literals (matches Stripe's convention for plan IDs in Phase 2)
- `free` is the default state — every registered user starts here
- These exact strings will become the `id` field on Stripe Price objects in Phase 2

---

### 2.2 TIER_LEVELS (constant)

```typescript
// src/types/subscription.ts

export const TIER_LEVELS: Record<SubscriptionTier, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  enterprise: 3,
} as const;
```

**Purpose:** Numeric ranking enables cumulative hierarchy comparisons (`current >= required`).

**Why constants, not magic numbers:** Adding a future tier (e.g., `team` between `pro` and `enterprise`) requires updating ONLY this constant — every comparison automatically respects the new ordering.

---

### 2.3 Subscription

```typescript
// src/types/subscription.ts

export interface Subscription {
  tier: SubscriptionTier;
  status: 'active' | 'none';
  renewal_date: string | null;   // ISO 8601 date string; null when tier === 'free'
  started_at: string | null;     // ISO 8601 date string; null when tier === 'free'
}
```

**Invariants (enforced by service layer):**
- `tier === 'free'` → `status === 'none'`, `renewal_date === null`, `started_at === null`
- `tier !== 'free'` → `status === 'active'`, `renewal_date` and `started_at` are valid ISO dates

**Phase 2 additions (not in v1):** `stripe_subscription_id`, `stripe_customer_id`, `cancel_at_period_end`, `current_period_start`. Documented here so Phase 2 engineers know what's coming — not implemented in prototype.

---

### 2.4 Plan

```typescript
// src/types/subscription.ts

export interface Plan {
  id: string;                    // Matches tier value: "starter" | "pro" | "enterprise"
  tier: SubscriptionTier;        // Always one of: starter, pro, enterprise (NOT free)
  name: string;                  // Display name: "Starter", "Pro", "Enterprise"
  price_monthly: number;         // USD amount: 5, 15, 49
  description: string;           // One-line tagline shown under name
  features: string[];            // Bullet list shown on pricing card (3-5 items)
  highlighted: boolean;          // True for the "recommended" tier (Pro only in v1)
}
```

**Notes:**
- `free` is NOT a Plan — it has no price, no feature list, no card on pricing page
- `id === tier` for all plans (in Phase 2 these will diverge if Stripe Price IDs are used directly)

---

### 2.5 Article

```typescript
// src/types/article.ts

import type { SubscriptionTier } from './subscription';

export interface Article {
  id: string;                    // UUID-like string, stable identifier
  slug: string;                  // URL-safe: kebab-case, lowercase
  title: string;                 // Display title
  excerpt: string;               // 1-2 sentence summary for index cards
  required_tier: SubscriptionTier;  // 'free' = public; otherwise gated
  content_preview: string;       // Always shown (above paywall for gated articles)
  content_full: string;          // Full body; only rendered when tier check passes
  published_at: string;          // ISO 8601 date string
  author: string;                // Display name only (no user object link in v1)
}
```

**Notes:**
- `content_preview` is ALWAYS rendered, regardless of tier — it's the teaser
- `content_full` is rendered only when `current_tier >= required_tier` (cumulative check)
- For `required_tier === 'free'`, the Paywall component renders nothing and `content_full` shows below `content_preview`
- Plain string content for v1 — markdown rendering deferred to keep prototype lean

---

### 2.6 User

```typescript
// src/types/user.ts

import type { Subscription } from './subscription';

// Inherited from RBAC starter kit (DO NOT REDEFINE the role enum here)
export type UserRole = 'superadmin' | 'admin' | 'member';

export interface User {
  id: string;                    // Supabase auth user ID (UUID)
  email: string;
  role: UserRole;                // From RBAC starter kit's user_roles table
  subscription: Subscription;    // NEW — joined from future subscriptions table
}
```

**Notes:**
- Full Supabase user object has more fields (`created_at`, `email_verified`, etc.) — only relevant subset typed here
- `role` and `subscription` are populated from DIFFERENT sources (in Phase 2: `user_roles` table and `subscriptions` table respectively)
- Conceptually orthogonal — re-emphasizing the architectural boundary

---

## 3. Service Layer Interfaces

These are the EXACT signatures every component will call. The interface is the contract — the implementation swaps from mock (this phase) to real (Phase 2) without any signature changes.

### 3.1 subscriptionService

```typescript
// src/services/subscriptionService.ts

import type { Subscription, Plan, SubscriptionTier } from '@/types/subscription';

export const subscriptionService = {
  /**
   * Returns the current user's subscription state.
   * In v1: reads from useDevSubscriptionStore (dev toggle).
   * In Phase 2: queries Supabase subscriptions table by auth.uid().
   */
  getCurrentSubscription: async (): Promise<Subscription>,

  /**
   * Returns all plans available for subscription (Starter, Pro, Enterprise).
   * Order: Starter → Pro → Enterprise (price ascending).
   * In v1: returns mock data.
   * In Phase 2: queries Supabase plans table OR Stripe Prices API.
   */
  getPlans: async (): Promise<Plan[]>,

  /**
   * MOCK-ONLY in v1: flips the dev toggle to the requested tier.
   * In Phase 2: this method is REPLACED with createCheckoutSession()
   * which returns a Stripe Checkout URL for redirect.
   *
   * @param tier - The tier the user is subscribing to (not 'free')
   * @returns Path to redirect to (success page in v1; Stripe URL in Phase 2)
   */
  subscribe: async (tier: Exclude<SubscriptionTier, 'free'>): Promise<{ redirect_url: string }>,

  /**
   * Helper: checks if current subscription tier meets or exceeds required tier.
   * Uses cumulative hierarchy from TIER_LEVELS.
   * Pure function — no side effects, no async.
   */
  hasAccess: (current: SubscriptionTier, required: SubscriptionTier): boolean,
};
```

**Critical:** `subscribe()` is the method that swaps most dramatically in Phase 2. In v1 it just flips a toggle. In Phase 2 it calls a server route that creates a Stripe Checkout Session and returns the hosted URL. UI components stay identical — they just call `subscribe('pro')` and follow the returned `redirect_url`.

---

### 3.2 articleService

```typescript
// src/services/articleService.ts

import type { Article } from '@/types/article';

export const articleService = {
  /**
   * Returns all articles, sorted by published_at descending.
   * Returns FULL article objects including content_full.
   * Tier filtering happens at the page/component level, not here.
   */
  getAll: async (): Promise<Article[]>,

  /**
   * Returns a single article by slug.
   * Returns FULL article object — gating decision made by caller.
   * Returns null if no article matches the slug.
   */
  getBySlug: async (slug: string): Promise<Article | null>,

  /**
   * Returns the N most recent articles. Used by home page teaser section.
   * Default: 3 articles.
   */
  getRecent: async (limit?: number): Promise<Article[]>,
};
```

**Why no `getFreeOnly()` or `getByTier()`:** Tier filtering is a presentation concern, not a data concern. Pages decide which articles to show and how. Service stays simple.

**Security note for Phase 2:** When real backend lands, `content_full` for gated articles must NEVER be sent to the client unless tier check passes. This will require either (a) two query methods (`getPreview` vs `getFull`) or (b) server-side filtering of the response payload. Decision deferred to Phase 2 — for prototype, all data is client-side mock so this concern is dormant.

---

### 3.3 userService

```typescript
// src/services/userService.ts

import type { User } from '@/types/user';

export const userService = {
  /**
   * Returns the currently logged-in user with subscription joined.
   * Returns null if not authenticated.
   * In v1: returns mock user with subscription from useDevSubscriptionStore.
   * In Phase 2: queries Supabase auth + user_roles + subscriptions tables.
   */
  getCurrentUser: async (): Promise<User | null>,
};
```

**Note:** This is the single source of truth for "who is the current user, and what's their full state?" Components needing both role AND subscription should call this once, not call separate auth + subscription services.

---

## 4. Tier Logic (Pure Helpers)

```typescript
// src/lib/tiers.ts

import { TIER_LEVELS, type SubscriptionTier } from '@/types/subscription';

/**
 * Cumulative hierarchy check.
 * Returns true if `current` tier meets or exceeds `required` tier.
 *
 * Examples:
 *   meetsTier('pro', 'starter')      → true   (Pro includes Starter)
 *   meetsTier('starter', 'pro')      → false  (Starter does not include Pro)
 *   meetsTier('enterprise', 'free')  → true   (Everyone has free access)
 *   meetsTier('free', 'starter')     → false  (Free user cannot access Starter)
 */
export function meetsTier(
  current: SubscriptionTier,
  required: SubscriptionTier
): boolean {
  return TIER_LEVELS[current] >= TIER_LEVELS[required];
}

/**
 * Returns human-readable tier name for display.
 * Examples: 'free' → 'Free', 'enterprise' → 'Enterprise'
 */
export function tierDisplayName(tier: SubscriptionTier): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}
```

**Critical:** `meetsTier()` is the ONLY place hierarchy comparison logic lives. Every gate helper, every paywall, every conditional render uses this function. Single source of truth — change it once, behavior changes everywhere.

---

## 5. Gate Helper (NEW)

```typescript
// src/lib/auth/requireSubscriptionTier.ts

import { redirect } from 'next/navigation';
import type { SubscriptionTier } from '@/types/subscription';
import { meetsTier } from '@/lib/tiers';
import { userService } from '@/services/userService';

/**
 * Server-side route protection by subscription tier.
 * Mirrors the pattern of requireUser() and requireRole() from RBAC starter kit.
 *
 * If user is not logged in → redirect to /auth/signin?next=<current-path>
 * If user's tier is below required → redirect to /pricing?next=<current-path>
 * If tier check passes → returns the User object for use in the page
 *
 * @param required - Minimum tier needed to access this route
 * @param currentPath - The current route path (for ?next= redirect chain)
 */
export async function requireSubscriptionTier(
  required: SubscriptionTier,
  currentPath: string
): Promise<User> {
  const user = await userService.getCurrentUser();

  if (!user) {
    redirect(`/auth/signin?next=${encodeURIComponent(currentPath)}`);
  }

  if (!meetsTier(user.subscription.tier, required)) {
    redirect(`/pricing?next=${encodeURIComponent(currentPath)}`);
  }

  return user;
}
```

**Composition with existing helpers:**
- `requireUser()` (existing) → checks login only
- `requireRole(role)` (existing) → checks role membership
- `requireSubscriptionTier(tier, path)` (new) → checks subscription tier

These compose. A page can call `requireUser()` first for clarity, then `requireSubscriptionTier()` for the tier check. (Though `requireSubscriptionTier()` already implies login — calling `requireUser()` first is optional belt-and-suspenders.)

---

## 6. Dev Subscription Store (Zustand)

```typescript
// src/store/useDevSubscriptionStore.ts

import { create } from 'zustand';
import type { SubscriptionTier } from '@/types/subscription';

interface DevSubscriptionState {
  mockTier: SubscriptionTier;
  setMockTier: (tier: SubscriptionTier) => void;
}

/**
 * DEV-ONLY store for prototype phase.
 * Drives the mock subscription state across the entire app.
 *
 * SECURITY: This store and its widget MUST be excluded from production builds.
 * Gate all imports behind `process.env.NODE_ENV !== 'production'`.
 *
 * In Phase 2: this store is DELETED. Real subscription state comes from
 * Supabase via subscriptionService.getCurrentSubscription().
 */
export const useDevSubscriptionStore = create<DevSubscriptionState>((set) => ({
  mockTier: 'free',
  setMockTier: (tier) => set({ mockTier: tier }),
}));

// Selectors (per STATE_MANAGEMENT_MANUAL.md — components use selectors, not direct state)
export const selectMockTier = (state: DevSubscriptionState) => state.mockTier;
export const selectSetMockTier = (state: DevSubscriptionState) => state.setMockTier;
```

**Usage by service layer (mock implementation):**

```typescript
// src/services/subscriptionService.ts (mock implementation)

import { useDevSubscriptionStore } from '@/store/useDevSubscriptionStore';

getCurrentSubscription: async () => {
  const tier = useDevSubscriptionStore.getState().mockTier;
  return buildSubscriptionFromTier(tier);  // helper builds full Subscription object
}
```

**The chain:** Dev widget → store → service layer → components. Components never read the store directly. This preserves the swap point — when real backend lands, only the service layer's internals change.

---

## 7. Mock Data Specifications

### 7.1 Plans (`src/mocks/data/plans.ts`)

Three Plan objects, in this exact order:

```typescript
export const mockPlans: Plan[] = [
  {
    id: 'starter',
    tier: 'starter',
    name: 'Starter',
    price_monthly: 5,
    description: 'For curious readers getting started',
    features: [
      'All free articles',
      'Starter-tier premium articles',
      'Email newsletter',
    ],
    highlighted: false,
  },
  {
    id: 'pro',
    tier: 'pro',
    name: 'Pro',
    price_monthly: 15,
    description: 'For working developers who want depth',
    features: [
      'Everything in Starter',
      'Pro-tier premium articles',
      'Monthly deep-dives',
      'Community access',
    ],
    highlighted: true,
  },
  {
    id: 'enterprise',
    tier: 'enterprise',
    name: 'Enterprise',
    price_monthly: 49,
    description: 'For teams and architects',
    features: [
      'Everything in Pro',
      'Enterprise-tier articles',
      'Early access content',
      'Downloadable resources',
      'Priority support',
    ],
    highlighted: false,
  },
];
```

---

### 7.2 Articles (`src/mocks/data/articles.ts`)

Exactly 6 articles, distributed as:
- **2 free** (public, fully readable by anyone)
- **2 starter-tier** (visible to Starter+)
- **1 pro-tier** (visible to Pro+)
- **1 enterprise-tier** (visible to Enterprise only)

```typescript
export const mockArticles: Article[] = [
  // FREE TIER (2)
  {
    id: 'art-001',
    slug: 'why-rbac-and-subscriptions-are-different',
    title: 'Why RBAC and Subscriptions Are Different Systems',
    excerpt: 'A deep look at why mixing roles and tiers leads to architectural pain.',
    required_tier: 'free',
    content_preview: '[Free article preview text — 1 paragraph]',
    content_full: '[Free article full body — 3-4 paragraphs of placeholder content]',
    published_at: '2026-04-10T00:00:00Z',
    author: 'Tony Stark',
  },
  {
    id: 'art-002',
    slug: 'getting-started-with-nextjs-app-router',
    title: 'Getting Started with the Next.js App Router',
    excerpt: 'A practical guide to routing in modern Next.js applications.',
    required_tier: 'free',
    content_preview: '[Free article preview text]',
    content_full: '[Free article full body]',
    published_at: '2026-04-08T00:00:00Z',
    author: 'Tony Stark',
  },

  // STARTER TIER (2)
  {
    id: 'art-003',
    slug: 'supabase-row-level-security-deep-dive',
    title: 'Supabase Row Level Security: A Deep Dive',
    excerpt: 'How RLS policies work, when to use them, and common pitfalls.',
    required_tier: 'starter',
    content_preview: '[Starter article preview — visible to all]',
    content_full: '[Starter article full body — gated]',
    published_at: '2026-04-05T00:00:00Z',
    author: 'Tony Stark',
  },
  {
    id: 'art-004',
    slug: 'zustand-patterns-for-large-apps',
    title: 'Zustand Patterns for Large Applications',
    excerpt: 'Selectors, slices, and store composition strategies.',
    required_tier: 'starter',
    content_preview: '[Starter article preview]',
    content_full: '[Starter article full body — gated]',
    published_at: '2026-04-03T00:00:00Z',
    author: 'Tony Stark',
  },

  // PRO TIER (1)
  {
    id: 'art-005',
    slug: 'building-stripe-subscriptions-the-right-way',
    title: 'Building Stripe Subscriptions the Right Way',
    excerpt: 'Webhooks, idempotency, and the cache-with-authoritative-source pattern.',
    required_tier: 'pro',
    content_preview: '[Pro article preview]',
    content_full: '[Pro article full body — gated]',
    published_at: '2026-04-01T00:00:00Z',
    author: 'Tony Stark',
  },

  // ENTERPRISE TIER (1)
  {
    id: 'art-006',
    slug: 'multi-tenant-architecture-for-saas',
    title: 'Multi-Tenant Architecture for SaaS Platforms',
    excerpt: 'Org-level subscriptions, tenant isolation, and Mothership-grade patterns.',
    required_tier: 'enterprise',
    content_preview: '[Enterprise article preview]',
    content_full: '[Enterprise article full body — gated]',
    published_at: '2026-03-28T00:00:00Z',
    author: 'Tony Stark',
  },
];
```

---

### 7.3 User (`src/mocks/data/users.ts`)

One mock user, with subscription tier driven by the dev store:

```typescript
import { useDevSubscriptionStore } from '@/store/useDevSubscriptionStore';
import type { User } from '@/types/user';
import type { Subscription } from '@/types/subscription';

function buildSubscription(tier: SubscriptionTier): Subscription {
  if (tier === 'free') {
    return {
      tier: 'free',
      status: 'none',
      renewal_date: null,
      started_at: null,
    };
  }
  return {
    tier,
    status: 'active',
    renewal_date: '2026-05-15T00:00:00Z',  // mocked future date
    started_at: '2026-04-15T00:00:00Z',
  };
}

export function getMockUser(): User {
  const mockTier = useDevSubscriptionStore.getState().mockTier;
  return {
    id: 'mock-user-001',
    email: 'sarah@example.com',
    role: 'member',
    subscription: buildSubscription(mockTier),
  };
}
```

**Why a function, not a constant:** The user's subscription needs to update reactively when the dev toggle changes. A function call returns the current state at read time.

---

## 8. Where Mocks Live & How They're Removed

```
src/mocks/
├── README.md          ← "DELETE THIS FOLDER WHEN BACKEND IS WIRED"
└── data/
    ├── plans.ts
    ├── articles.ts
    └── users.ts
```

**README.md content:**

```markdown
# MOCK DATA — DELETE IN PHASE 2

This folder exists ONLY for the frontend prototype phase.

When real backend is wired (Stripe + Supabase subscriptions table):
1. Update services in src/services/* to query real data sources
2. Delete this entire folder
3. Delete src/store/useDevSubscriptionStore.ts
4. Delete the dev tier toggle widget component
5. Verify no imports from `@/mocks` remain anywhere

If anything still imports from `@/mocks`, the swap is incomplete.
```

---

## 9. Type Inheritance from RBAC Starter Kit

This contract ADDS to the starter kit's existing types — it does NOT modify them.

**Untouched types from starter kit:**
- `UserRole` (`'superadmin' | 'admin' | 'member'`)
- The starter kit's User type (we extend it via composition with `subscription`)
- All existing auth helpers (`requireUser()`, `requireRole()`)

**New types added by this contract:**
- `SubscriptionTier`
- `Subscription`
- `Plan`
- `Article`
- Extended `User` (adds `subscription` field)

**New helpers added:**
- `meetsTier()` (pure function, tier comparison)
- `tierDisplayName()` (pure function, display formatting)
- `requireSubscriptionTier()` (server-side route guard)

---

## 10. Validation Rules (Enforced in Service Layer)

These invariants must hold across all subscription data:

| Rule | Enforcement |
|------|-------------|
| `tier === 'free'` ↔ `status === 'none'` | Service layer constructs Subscription objects |
| `tier !== 'free'` → `renewal_date` is valid ISO string | Service layer validates before returning |
| `meetsTier(current, required)` is the ONLY tier comparison | Linter rule (manual review for v1) |
| Plans are returned in price-ascending order | `getPlans()` sorts before returning |
| Articles are returned in `published_at` descending | `getAll()` and `getRecent()` sort before returning |
| `content_full` is always returned (v1 only — Phase 2 will gate this server-side) | Mock implementation; security-deferred to Phase 2 |

---

## 11. Phase 2 Migration Notes (Preview)

When Phase 2 lands, these are the expected changes — recorded here for forward compatibility:

**Subscription type — new fields:**
```typescript
stripe_subscription_id: string | null;
stripe_customer_id: string | null;
cancel_at_period_end: boolean;
current_period_start: string | null;
```

**subscriptionService.subscribe() signature change:**
```typescript
// v1 (mock): returns { redirect_url } pointing to /subscribe/success
// Phase 2 (real): returns { redirect_url } pointing to checkout.stripe.com/...
// Caller code stays identical — both are URLs to redirect to.
```

**New service methods in Phase 2:**
- `subscriptionService.cancelSubscription()`
- `subscriptionService.openCustomerPortal()`

**Database changes (Phase 2):**
- New `subscriptions` table in Supabase
- New `webhook_events` table for idempotency tracking
- RLS policies on `subscriptions`: users SELECT own; only service role INSERT/UPDATE/DELETE

---

## 12. Sign-Off Checklist

Before handoff to UI_SPEC + FILE_TREE:

- [ ] All types defined with exact field names and value sets
- [ ] All service method signatures defined with return types
- [ ] Tier hierarchy logic centralized in `meetsTier()`
- [ ] Gate helper `requireSubscriptionTier()` defined
- [ ] Dev store rules and security gating documented
- [ ] Mock data shapes match Article/Plan/User types exactly
- [ ] Mock removal procedure documented
- [ ] Phase 2 migration notes recorded
- [ ] Tony signs off on this DATA_CONTRACT v1.0

---

**END OF DATA_CONTRACT v1.0**
