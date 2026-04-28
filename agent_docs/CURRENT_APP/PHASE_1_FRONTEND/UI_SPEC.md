# UI_SPEC: StarkReads — Subscription v1 Prototype

> **Version:** 1.1
> **Date:** 2026-04-15
> **Status:** APPROVED
> **Inherits From:** APP_BRIEF v1.2, DATA_CONTRACT v1.0
> **Author:** Architect (Claude) for Tony Stark
> **Changes from v1.0:** Updated route group from `(authenticated)` to `(members)`; added cookie sync to DevTierToggle; added LoginForm/RegisterForm `?next=` extension specs; added NavbarHome extension spec; added `safeRedirect()` helper spec.

---

## Purpose

This document is a **prescriptive UI specification** for every screen, component, and state in the StarkReads prototype. It compensates for the absence of Stitch designs by being highly explicit about layout, composition primitives, ShadCN components, and behavior.

**Reading order for Claude Code:** Read APP_BRIEF first (scope), DATA_CONTRACT second (types/services), this doc third (visual + behavior), FILE_TREE fourth (where to put files).

---

## 1. Design Anchors

**Inherited from RBAC v2 starter kit (DO NOT REINVENT):**
- `<Page>` primitive for page wrapper (use `FULL={false}` for centered content)
- `<Row>` primitive for horizontal sections
- `<Box>` primitive for content blocks/cards
- ShadCN: Button, Card, Badge, Input, Label, Toast (sonner), Dialog
- Tailwind tokens: `bg-primary`, `text-foreground`, `bg-muted`, `text-muted-foreground`
- Typography: `h1`, `h2`, `h3` className utilities
- The `cn()` utility for class merging

**Vibe references (Claude Code pattern-matches from training):**
- **Pricing page:** stripe.com/pricing — three columns, middle highlighted, clean
- **Article paywall:** medium.com — preview fades into CTA
- **Landing hero:** vercel.com — minimal, confident
- **Success page:** linear.app post-signup — restrained celebration

---

## 2. Global UI Additions

### 2.1 Navbar Extensions (Authenticated)

**File:** `src/components/global/Navbar.tsx` (existing — extend, don't rewrite)

**Used by:** Authenticated routes under `(members)` route group.

**Additions only:**

1. **"Pricing" link** in the main nav links
   - Position: between existing nav items
   - Active state: standard navbar active styling

2. **Subscription Tier Badge** next to logged-in user's name/avatar
   - Component: `<TierBadge tier={user.subscription.tier} />`
   - Position: immediately right of user display name (or left of avatar dropdown)
   - Visible only when user is logged in
   - Hidden when not logged in (no badge)

**Untouched:** Logo, layout, auth buttons, mobile hamburger behavior — all stay as-is.

---

### 2.2 NavbarHome Extensions (Public)

**File:** `src/components/global/NavbarHome.tsx` (existing — extend, don't rewrite)

**Used by:** Public routes (`/`, `/articles`, `/articles/[slug]`, `/pricing`).

**Additions only:**

1. **"Articles" link** → `/articles`
2. **"Pricing" link** → `/pricing`

**Position:** Between existing logo and auth buttons.

**No TierBadge here.** Anonymous users have no tier.

**Untouched:** Logo, layout, "Sign In" / "Sign Up" buttons, mobile behavior.

---

### 2.3 TierBadge Component (NEW)

**File:** `src/components/common/TierBadge.tsx`

**Purpose:** Single visual indicator of subscription tier. Used in authenticated Navbar and account page.

**Inputs:**
```typescript
interface TierBadgeProps {
  tier: SubscriptionTier;
  size?: 'sm' | 'md';  // default 'sm'
}
```

**Visual:**
- Built on ShadCN `Badge` component
- Color mapping (use Tailwind tokens, no hex codes):
  - `free` → `variant="secondary"` (muted gray)
  - `starter` → `variant="default"` with custom blue tint
  - `pro` → `variant="default"` with custom purple/violet tint
  - `enterprise` → `variant="default"` with custom amber/gold tint
- Text: `tierDisplayName(tier)` ("Free", "Starter", "Pro", "Enterprise")
- Size `sm`: `text-xs px-2 py-0.5`
- Size `md`: `text-sm px-3 py-1`

**No icon in v1.** Pure text badge.

---

### 2.4 Member Portal Sidebar (EXTEND)

**File:** `src/components/layout/Sidebar.tsx` (existing — extend)

**Add new CommandGroup: "Premium Content"**

Three items, conditionally styled by tier access:

```
- Starter Content      [icon: BookOpen]   → /members-portal/starter
- Pro Content          [icon: Sparkles]   → /members-portal/pro
- Enterprise Content   [icon: Crown]      → /members-portal/enterprise
```

**Conditional rendering rules:**

For each item, check `meetsTier(user.subscription.tier, requiredTier)`:
- **Tier accessible:** Render normally (full opacity, clickable Link)
- **Tier locked:** Render with `opacity-50`, lock icon (Lucide `Lock`) appended right, link still clickable (lands on tier page → which redirects to /pricing)

**Why click-through-when-locked:** Discoverability. Users see what they're missing and can learn what each tier unlocks. Matches Notion/Linear sidebar UX.

---

### 2.5 Auth Form Extensions (CRITICAL — `?next=` Plumbing)

**Files:**
- `src/components/auth/LoginForm.tsx` (existing — extend)
- `src/components/auth/RegisterForm.tsx` (existing — extend)

**Purpose:** Without this, the entire intent-aware redirect chain is broken. User clicks "Subscribe" → register → lands on default page instead of `/pricing`.

**Changes to each form (~5 lines each):**

1. Read `next` from URL search params (use `useSearchParams()` from `next/navigation`)
2. Validate `next` via `safeRedirect()` helper (see Section 4.5)
3. After successful auth, redirect to validated `next` if present, otherwise the form's existing default destination

**Pseudocode:**

```typescript
"use client";
import { useSearchParams, useRouter } from 'next/navigation';
import { safeRedirect } from '@/lib/safeRedirect';

const searchParams = useSearchParams();
const router = useRouter();
const nextParam = searchParams.get('next');
const safeNext = safeRedirect(nextParam);  // returns validated path or null

const handleAuthSuccess = () => {
  router.push(safeNext ?? '/members-portal');  // or whatever the existing default is
};
```

**Critical:** Use `safeRedirect()` — never use the raw `next` value directly. Open-redirect vulnerability if not validated.

**Untouched:** All form fields, validation, Supabase auth calls, error handling, styling. Only the post-success redirect logic changes.

---

### 2.6 Dev Tier Toggle Widget (NEW, DEV-ONLY)

**File:** `src/components/dev/DevTierToggle.tsx`

**Purpose:** Floating widget for switching mock subscription tier during development.

**Visual:**
- Fixed position: `bottom-4 right-4`
- z-index: `z-50`
- Small card (`w-56`) with subtle shadow
- Title row: "Dev: Mock Tier" with small wrench/settings icon
- Four button options stacked or in a 2x2 grid:
  - `Free` `Starter` `Pro` `Enterprise`
- Currently active tier highlighted (use `variant="default"`); others use `variant="outline"`
- Bottom note (text-xs, muted): "Dev only — not in production"

**Behavior — DUAL-WRITE (critical):**

When user clicks any tier button, the handler must:

1. Call `setMockTier(tier)` from `useDevSubscriptionStore` (updates client state immediately)
2. Set the `dev_mock_tier` cookie (so server-side gate helpers can read it on next request)
3. Trigger a router refresh (`router.refresh()`) so server components re-render with new tier

```typescript
const handleTierChange = (tier: SubscriptionTier) => {
  // 1. Update Zustand (client-side, immediate)
  setMockTier(tier);
  
  // 2. Set cookie (server-side, next request)
  document.cookie = `dev_mock_tier=${tier}; path=/; max-age=86400; samesite=lax`;
  
  // 3. Refresh server components
  router.refresh();
};
```

**Cookie attributes:**
- `path=/` — available everywhere
- `max-age=86400` — 24 hour expiry (dev convenience)
- `samesite=lax` — CSRF protection
- NOT `httpOnly` — must be readable from JS for the dual-write
- NOT `secure` — works on localhost without HTTPS

**Mounting:**
- Mounted in root layout (`src/app/layout.tsx`)
- Wrapped in env check: `{process.env.NODE_ENV !== 'production' && <DevTierToggle />}`
- NEVER appears in production builds

---

## 3. Page Specifications

### 3.1 Home Page (`/`)

**File:** `src/app/(public)/page.tsx` + `HomePageContent.tsx`

**Purpose:** Semi-pro landing. Hero, value prop, recent articles, pricing teaser, CTA.

**Sections (top to bottom):**

**Section A — Hero**
- `<Page FULL={false}>` wrapper
- `<Row>` centered text
- H1: "StarkReads" (large, bold)
- Subtitle: "Premium tech writing for working developers." (text-muted-foreground, text-xl)
- Primary CTA Button: "See Pricing" → `/pricing`
- Secondary Button (outline): "Browse Articles" → `/articles`
- Vertical padding: generous (`py-20`)

**Section B — Recent Articles Teaser**
- `<Row>` with header: H2 "Recent Articles"
- Grid: `grid grid-cols-1 md:grid-cols-3 gap-6`
- Use `<ArticleCard>` component (see 4.1) for each
- Show 3 articles from `articleService.getRecent(3)` — mix of free + gated
- Below grid: Link "View all articles →" right-aligned, `/articles`

**Section C — Pricing Teaser**
- `<Row>` with header: H2 "Choose Your Plan"
- Subhead: "Three tiers. Cancel anytime." (text-muted-foreground)
- Single primary Button: "View Plans" → `/pricing`
- Background tint: `bg-muted/30` to differentiate from page above
- Generous padding

**Footer:** Inherit existing footer from starter kit (no changes).

**States:**
- Loading: Skeleton cards in articles grid (use ShadCN `Skeleton`)
- Error: If `articleService` fails, show inline error banner above articles section, hero still renders

---

### 3.2 Articles Index (`/articles`)

**File:** `src/app/(public)/articles/page.tsx` + `ArticlesIndexContent.tsx`

**Purpose:** Public list of all articles, tier badges visible.

**Layout:**
- `<Page FULL={false}>`
- `<Row>` header: H1 "All Articles"
- `<Row>` subhead: "Free + premium tech writing." (text-muted-foreground)
- `<Row>` grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
  - Maps `articleService.getAll()` through `<ArticleCard>` for each

**States:**
- Loading: 6 skeleton cards
- Empty: "No articles yet." centered (won't happen in v1, but defensive)
- Error: Centered error message with retry button

---

### 3.3 Article Detail (`/articles/[slug]`)

**File:** `src/app/(public)/articles/[slug]/page.tsx` + `ArticleDetailContent.tsx`

**Purpose:** Single article. Free → full content. Gated → preview + Paywall.

**Layout:**
- `<Page FULL={false}>` with narrower max-width (`max-w-3xl`)
- `<Row>` Article header:
  - `<TierBadge tier={article.required_tier} />` (only shown if `required_tier !== 'free'`)
  - H1: article title
  - Meta line: `{author} · {published_at formatted}` (text-sm text-muted-foreground)
- `<Row>` content prose (use `prose` Tailwind class):
  - ALWAYS render `article.content_preview`
  - Then render `<Paywall>` component (see 4.2)
  - If paywall returns null (user has access), render `article.content_full` BELOW the preview

**Page-level data fetching:**
- Server component
- Calls `articleService.getBySlug(params.slug)` and `userService.getCurrentUser()`
- If article not found: Next.js `notFound()`

**States:**
- Loading: Skeleton title + paragraph blocks
- Not found: 404 (Next.js default)

**Critical:** This page is the ONLY place `<Paywall>` is used. Do not duplicate paywall logic into `ArticleCard` or anywhere else.

---

### 3.4 Pricing Page (`/pricing`)

**File:** `src/app/(public)/pricing/page.tsx` + `PricingPageContent.tsx`

**Purpose:** Show 3 tier cards. Subscribe buttons trigger mock subscribe flow.

**Layout:**
- `<Page FULL={false}>`
- `<Row>` header centered:
  - H1: "Choose Your Plan"
  - Subhead: "Cancel anytime. Upgrade or downgrade whenever." (text-muted-foreground)
- `<Row>` plan grid: `grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto`
  - Maps `subscriptionService.getPlans()` through `<PlanCard>` (see 4.3)
- Below grid: Small text centered: "All plans include access to free articles."

**Behavior:**
- Read `?next=` query param from URL — validate via `safeRedirect()` — pass validated value to PlanCard so subscribe redirect honors intent
- Page is a Server Component for plans data; PlanCard is a Client Component (needs onClick handler)

**States:**
- Loading: 3 skeleton cards
- Error: Centered error message

---

### 3.5 Subscribe Success (`/subscribe/success`)

**File:** `src/app/(members)/subscribe/success/page.tsx` + `SubscribeSuccessContent.tsx`

**Purpose:** Confirmation after mock subscription. Honors `?next=` for return.

**Layout:**
- `<Page FULL={false}>` centered
- `<Row>` centered card-style block:
  - Large green check icon (Lucide `CheckCircle2`, size 64, text-green-500)
  - H1: "Welcome to {tierName}!"
  - Body: "Your subscription is active. You now have access to {tierName} content."
  - Primary Button: 
    - If `?next=` present and valid (per `safeRedirect()`): "Continue" → navigates to `next`
    - Otherwise: "Read Premium Articles" → `/members-portal/{tier}`
  - Secondary link: "View account" → `/members-portal/account`

**Server-side:**
- Calls `requireUser()` — must be logged in
- Reads current tier via `userService.getCurrentUser()` to display correct name

**States:**
- Loading: Skeleton card
- Free tier somehow lands here (shouldn't happen): Show fallback message "Something went wrong" with link to `/pricing`

---

### 3.6 Member Portal Home (`/members-portal`)

**File:** `src/app/(members)/members-portal/page.tsx` + `MembersPortalContent.tsx`

**Status:** EXISTING in starter kit. Minor extension only.

**Add (do NOT redesign existing layout):**

One new `<Row>` near the top: "Your Subscription"
- Small card showing:
  - "Current plan: " + `<TierBadge tier={user.subscription.tier} size="md" />`
  - If `tier === 'free'`: Button "Upgrade to Pro" → `/pricing`
  - If `tier !== 'free'`: Link "Manage subscription" → `/members-portal/account`

Everything else in the existing portal stays as-is.

---

### 3.7 Account Page (`/members-portal/account`)

**File:** `src/app/(members)/members-portal/account/page.tsx` + `AccountPageContent.tsx`

**Purpose:** Show user's subscription details. Placeholder for management.

**Layout:**
- `<Page FULL={false}>`
- `<Row>` header: H1 "Account"

- `<Row>` "Profile" section:
  - `<Box className="p-6">`
  - H2 "Profile"
  - Two key/value rows: Email, Role
  - Plain text values (no edit functionality in v1)

- `<Row>` "Subscription" section:
  - `<Box className="p-6">`
  - H2 "Subscription"
  - Key/value rows:
    - Current Plan: `<TierBadge tier={...} size="md" />`
    - If `tier !== 'free'`:
      - Started: formatted date from `started_at`
      - Renews: formatted date from `renewal_date`
    - If `tier === 'free'`: "You're on the free plan."
  - Buttons row:
    - If `tier === 'free'`: Button "Subscribe" → `/pricing`
    - If `tier !== 'free'`: 
      - Button "Manage Subscription" → onClick shows toast: "Subscription management coming soon"
      - Outline button "Change Plan" → `/pricing`

**Server-side:**
- Calls `requireUser()`
- Reads user via `userService.getCurrentUser()`

---

### 3.8 Tier-Gated Content Pages

**Files:** 
- `src/app/(members)/members-portal/starter/page.tsx`
- `src/app/(members)/members-portal/pro/page.tsx`
- `src/app/(members)/members-portal/enterprise/page.tsx`

**Each follows the SAME template** (only the tier name and content label change):

**Layout:**
- Server-side guard: `await requireSubscriptionTier('<tier>', '/members-portal/<tier>')`
- `<Page FULL={false}>`
- `<Row>`:
  - `<TierBadge tier="<tier>" size="md" />`
  - H1: "{TierName} Content"
- `<Row>` description: "Welcome to {TierName} content. As a {TierName} subscriber, you have access to:" (text-muted-foreground)
- `<Row>` content card:
  - `<Box className="p-8">`
  - H2: "🎉 You're in!"
  - Body paragraph: "This page is gated to {TierName}+ subscribers. The fact that you can see it means the gate is working correctly."
  - Smaller paragraph: "In the production version, this is where {tier-specific content type} would live."
- `<Row>` "Lower tier content" link section (only for Pro and Enterprise pages):
  - "You also have access to:" with links to lower-tier pages
  - Pro page links to: Starter Content
  - Enterprise page links to: Starter Content, Pro Content

**Why so simple:** These pages exist to PROVE the gating works, not to deliver real content. Three nearly-identical pages with tier labels demonstrate the cumulative hierarchy in action.

---

## 4. New Components

### 4.1 ArticleCard

**File:** `src/components/articles/ArticleCard.tsx`

**Purpose:** Reusable card for article list/teaser displays.

**Inputs:**
```typescript
interface ArticleCardProps {
  article: Article;
}
```

**Visual:**
- ShadCN `Card` component
- Card content layout:
  - Top row: `<TierBadge>` (only if `required_tier !== 'free'`)
  - Card title: article.title (line-clamp-2)
  - Card description: article.excerpt (line-clamp-3, text-muted-foreground)
  - Footer: `{author} · {formatted date}` (text-xs text-muted-foreground)
- Whole card is wrapped in `<Link href={`/articles/${article.slug}`}>`
- Hover: subtle shadow elevation, cursor-pointer

**No paywall logic in this component.** Cards always link to detail page; paywall enforcement is on the detail page only.

---

### 4.2 Paywall

**File:** `src/components/articles/Paywall.tsx`

**Purpose:** Single source of truth for paywall UX. Per APP_BRIEF Section 20.

**Inputs:**
```typescript
interface PaywallProps {
  required_tier: SubscriptionTier;
  current_tier: SubscriptionTier;
  is_authenticated: boolean;
  current_path: string;  // for ?next= chain
}
```

**Behavior:**

```typescript
import { meetsTier } from '@/lib/tiers';

export function Paywall({ required_tier, current_tier, is_authenticated, current_path }: PaywallProps) {
  // Access granted — render nothing, caller renders full content
  if (meetsTier(current_tier, required_tier)) {
    return null;
  }

  // Determine CTA based on auth state
  const isAnonymous = !is_authenticated;
  const ctaHref = isAnonymous
    ? `/auth?next=${encodeURIComponent(current_path)}`
    : `/pricing?next=${encodeURIComponent(current_path)}`;
  const ctaLabel = isAnonymous
    ? 'Sign up to read'
    : `Upgrade to ${tierDisplayName(required_tier)}`;

  return (
    // Visual structure below
  );
}
```

**Visual structure:**
- Wrapper div with gradient fade-in from transparent (suggests content is cut off):
  - `<div className="relative -mt-32 pt-32 bg-gradient-to-t from-background via-background/95 to-transparent">`
- Inside, centered card:
  - `<Box className="p-8 text-center max-w-md mx-auto bg-muted/50 border rounded-lg">`
  - Lock icon (Lucide `Lock`, size 32, text-muted-foreground, centered)
  - H3: `"This is {required_tier_display} content"`
  - Body (text-muted-foreground, text-sm): 
    - Anonymous: "Sign up for a {required_tier_display} subscription to keep reading."
    - Authenticated: "Upgrade to {required_tier_display} to keep reading."
  - Primary Button: `{ctaLabel}` → `{ctaHref}`

---

### 4.3 PlanCard

**File:** `src/components/subscriptions/PlanCard.tsx`

**Purpose:** Single tier card on the pricing page.

**Inputs:**
```typescript
interface PlanCardProps {
  plan: Plan;
  next?: string;  // validated ?next= from pricing page URL, passed through subscribe flow
}
```

**Visual:**
- ShadCN `Card` component
- If `plan.highlighted === true`:
  - Border: `border-2 border-primary`
  - Small badge above title: "RECOMMENDED" (uppercase, text-xs, bg-primary text-primary-foreground, px-3 py-1 rounded-full)
  - Subtle shadow elevation
- Card layout:
  - Plan name (H3, large, bold)
  - Price block: 
    - "$" + `plan.price_monthly` (large, bold, e.g., text-4xl)
    - "/month" (text-muted-foreground, text-base, inline)
  - Description (text-muted-foreground, text-sm)
  - Divider
  - Features list:
    - Each feature in a row with check icon (Lucide `Check`, text-green-500, size 16)
    - text-sm, gap-2 between icon and text
  - Spacer
  - Subscribe button:
    - Full width
    - If `plan.highlighted`: `variant="default"` (primary)
    - Otherwise: `variant="outline"`
    - Label: `"Subscribe to {plan.name}"`
    - onClick: see Behavior below

**Behavior (onClick):**

This is a Client Component (`"use client"` at top).

```typescript
const handleSubscribe = async () => {
  const result = await subscriptionService.subscribe(plan.tier);
  // In v1 mock: result.redirect_url is "/subscribe/success?next=..."
  // In Phase 2: result.redirect_url is the Stripe Checkout URL
  
  // Append ?next= to redirect if passed in (already validated by parent)
  const url = next 
    ? `${result.redirect_url}${result.redirect_url.includes('?') ? '&' : '?'}next=${encodeURIComponent(next)}`
    : result.redirect_url;
  
  router.push(url);  // useRouter from next/navigation
};
```

**State:**
- During subscribe call: button shows spinner (use ShadCN `Loader2` icon spinning) and is disabled

---

### 4.4 DevTierToggle

Already specified in Section 2.6 above (with dual-write detail).

---

### 4.5 safeRedirect Helper

**File:** `src/lib/safeRedirect.ts`

**Purpose:** Centralized validation for `?next=` parameter. Used by LoginForm, RegisterForm, PricingPageContent, SubscribeSuccessContent — anywhere a `next` value is consumed.

**Signature:**

```typescript
/**
 * Validates a `next` parameter value for safe use as a redirect target.
 * Returns the validated path, or null if invalid.
 *
 * Validation rules (per APP_BRIEF Section 21):
 *   1. Must be a non-empty string
 *   2. Must start with "/"
 *   3. Must NOT start with "//" (rejects protocol-relative URLs)
 *   4. Must NOT contain ":" (rejects schemed URLs)
 *   5. Must NOT contain "\" (defense-in-depth)
 */
export function safeRedirect(next: string | null | undefined): string | null {
  if (!next || typeof next !== 'string') return null;
  if (!next.startsWith('/')) return null;
  if (next.startsWith('//')) return null;
  if (next.includes(':')) return null;
  if (next.includes('\\')) return null;
  return next;
}
```

**Usage pattern (universal):**

```typescript
const safeNext = safeRedirect(searchParams.get('next'));
router.push(safeNext ?? '/some-default');
```

**Pure function. No side effects. No async.** Easy to unit test if desired.

---

## 5. Loading, Empty, Error States (Universal Patterns)

### Loading

- Use ShadCN `Skeleton` component for content placeholders
- For data-bound pages: render skeleton in same grid/layout as the eventual content
- Keep skeletons visible for at least 200ms (avoid flash) — use `useTransition` for soft transitions

### Empty

- Centered message in muted text
- Helpful next-action button (e.g., "Browse Articles" or "Subscribe")
- Lucide `Inbox` or `FileText` icon above message, size 48, text-muted-foreground

### Error

- Centered error block with:
  - Icon (Lucide `AlertCircle`, text-destructive, size 32)
  - "Something went wrong" header
  - Optional error.message in monospace code block (only if not sensitive)
  - "Try again" button that retries the data fetch (or "Go home" link)
- Use ShadCN `Alert` component with `variant="destructive"`

---

## 6. Toasts & Feedback

Use ShadCN/sonner `toast()` for all transient feedback. Standard messages:

| Trigger | Toast Message | Variant |
|---------|---------------|---------|
| Mock subscribe success | "Subscribed to {Tier}!" | success |
| Tier upgrade required (redirected from gated route) | "Upgrade to {Tier} to access this content" | default |
| Manage Subscription click | "Subscription management coming soon" | default |
| Service layer error | "Couldn't load {data}. Please retry." | destructive |

Toasts mounted globally via `<Toaster />` in root layout (likely already exists in starter kit).

---

## 7. Responsive Behavior

Follow UI-UX-BUILDING-MANUAL.md mobile-first patterns. Specific notes:

- **Pricing page:** 1 column on mobile (cards stack vertically), 3 columns desktop
- **Articles index:** 1 column mobile, 2 column tablet, 3 column desktop
- **Article detail:** Single column always, narrower max-width on desktop (`max-w-3xl`)
- **Member portal sidebar:** Hidden on mobile (existing pattern), visible md+
- **DevTierToggle:** Always visible (dev only — desktop-focused use case)
- **Hero:** Stack CTAs vertically on mobile, horizontal on desktop

---

## 8. Accessibility Floor (v1)

Not exhaustive — minimum bar for prototype:

- All interactive elements must have visible focus states (use `focus-visible:ring-2`)
- All buttons have proper `aria-label` if icon-only
- Tap targets minimum 44x44px on touch (Button default sizes meet this)
- Article preview/full content uses `prose` class for readable typography
- Color is never the ONLY signal (tier badges have text labels, not just color)

---

## 9. Build Order (Recommended for Claude Code)

To minimize broken intermediate states, build in this order:

1. **Types** (DATA_CONTRACT Section 2) — `src/types/*.ts`
2. **Mock data** — `src/mocks/data/*.ts`
3. **Tier helpers** — `src/lib/tiers.ts`
4. **safeRedirect helper** — `src/lib/safeRedirect.ts`
5. **Dev store** — `src/store/useDevSubscriptionStore.ts`
6. **Service layer** — `src/services/*.ts` (with cookie reads for server-side)
7. **Gate helper** — `src/lib/auth/requireSubscriptionTier.ts`

→ **🛑 GATE 1: Pause for Tony's sign-off. Update RECOVERY.md.**

8. **Atomic components** — TierBadge, ArticleCard, Paywall, PlanCard
9. **DevTierToggle widget** (with cookie dual-write) + mount in root layout
10. **Navbar extensions** (authenticated) + NavbarHome extensions (public) + Sidebar extensions
11. **Auth form `?next=` plumbing** — LoginForm + RegisterForm

→ **🛑 GATE 2: Pause for Tony's sign-off. Update RECOVERY.md.**

12. **Public pages** — Home, Articles index, Article detail, Pricing
13. **Authenticated pages** — Subscribe success, Account, Members portal extension
14. **Tier-gated pages** — Starter, Pro, Enterprise content pages
15. **Manual smoke test** — Walk all 6 user flows from APP_BRIEF Section 7

→ **🛑 GATE 3: Pause for Tony's sign-off. Update RECOVERY.md. Hand back for review.**

---

## 10. Sign-Off Checklist

- [ ] All 8 page specs defined with layout, states, and data sources
- [ ] All 5 new components/helpers specified (TierBadge, ArticleCard, Paywall, PlanCard, safeRedirect)
- [ ] Paywall component contract matches APP_BRIEF Section 20
- [ ] Both navbars (authenticated + public) extension specs documented
- [ ] Sidebar extension specified (extend, not redesign)
- [ ] Auth form `?next=` plumbing specified (LoginForm + RegisterForm)
- [ ] DevTierToggle dual-write (cookie + store) specified
- [ ] Dev tier toggle gated to non-production builds
- [ ] Loading/empty/error states standardized
- [ ] Build order with three sign-off gates documented
- [ ] Tony signs off on this UI_SPEC v1.1

---

**END OF UI_SPEC v1.1**
