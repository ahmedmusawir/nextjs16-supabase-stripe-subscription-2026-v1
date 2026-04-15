import type { Article } from '@/types/article';

export const mockArticles: Article[] = [
  // FREE TIER (2)
  {
    id: 'art-001',
    slug: 'why-rbac-and-subscriptions-are-different',
    title: 'Why RBAC and Subscriptions Are Different Systems',
    excerpt:
      'A deep look at why mixing roles and tiers leads to architectural pain.',
    required_tier: 'free',
    content_preview:
      'One of the most common mistakes in SaaS architecture is conflating role-based access control (RBAC) with subscription tiers. On the surface they look similar — both gate access to features. But they serve fundamentally different purposes, and merging them creates a maintenance nightmare that compounds over time.',
    content_full:
      'One of the most common mistakes in SaaS architecture is conflating role-based access control (RBAC) with subscription tiers. On the surface they look similar — both gate access to features. But they serve fundamentally different purposes, and merging them creates a maintenance nightmare that compounds over time.\n\nRBAC answers the question: "What is this user allowed to do?" It\'s about permissions — can they edit other users, can they view admin dashboards, can they delete records. These are structural capabilities tied to the user\'s role in the organization.\n\nSubscription tiers answer a different question: "What has this user paid for?" It\'s about commercial access — can they read premium content, can they use advanced features, can they access enterprise integrations. These are value-based entitlements tied to a billing relationship.\n\nThe key insight is that these two dimensions are orthogonal. An admin user on a free tier should still have admin permissions — they just can\'t access premium content. A regular member on an enterprise tier should have full content access — but they still can\'t manage other users.\n\nWhen you implement tiers as roles (e.g., role = "pro_member"), you create a cartesian explosion: every combination of role × tier needs its own role definition. Three roles × four tiers = twelve role values, each with custom permission logic. Add a fifth tier or a fourth role and the matrix grows quadratically.\n\nThe correct pattern: keep roles in one table, subscriptions in another, and compose the checks at the point of use. A page that needs both admin access and pro-tier content calls requireRole("admin") AND requireSubscriptionTier("pro"). Clean, composable, independently evolvable.',
    published_at: '2026-04-10T00:00:00Z',
    author: 'Tony Stark',
  },
  {
    id: 'art-002',
    slug: 'getting-started-with-nextjs-app-router',
    title: 'Getting Started with the Next.js App Router',
    excerpt:
      'A practical guide to routing in modern Next.js applications.',
    required_tier: 'free',
    content_preview:
      'The App Router in Next.js 13+ represents a fundamental shift in how we think about routing in React applications. Gone are the days of pages/ directory conventions — the new app/ directory brings nested layouts, server components by default, and a more intuitive file-system routing model.',
    content_full:
      'The App Router in Next.js 13+ represents a fundamental shift in how we think about routing in React applications. Gone are the days of pages/ directory conventions — the new app/ directory brings nested layouts, server components by default, and a more intuitive file-system routing model.\n\nAt its core, the App Router uses a file-system convention where folders define routes and special files (page.tsx, layout.tsx, loading.tsx) define the UI for each route segment. This is more powerful than the old pages/ approach because layouts are preserved across navigations — your sidebar doesn\'t re-mount when you navigate between pages in the same section.\n\nRoute groups, denoted by parentheses like (public) or (admin), let you organize routes without affecting the URL structure. This is perfect for applying different layouts to different sections: public pages get a marketing navbar, admin pages get a sidebar with navigation, and auth pages get a minimal centered layout.\n\nServer components are the default in the App Router. This means your page.tsx files run on the server, can directly access databases, and send minimal JavaScript to the client. When you need interactivity — form submissions, state management, event handlers — you add the "use client" directive to create client components.\n\nThe key mental model: think of your app as a tree of layouts and pages. Layouts wrap their children and persist across navigations. Pages are the leaf nodes that render the actual content. This tree structure maps directly to your file system, making the architecture visible in your IDE\'s file explorer.',
    published_at: '2026-04-08T00:00:00Z',
    author: 'Tony Stark',
  },

  // STARTER TIER (2)
  {
    id: 'art-003',
    slug: 'supabase-row-level-security-deep-dive',
    title: 'Supabase Row Level Security: A Deep Dive',
    excerpt:
      'How RLS policies work, when to use them, and common pitfalls.',
    required_tier: 'starter',
    content_preview:
      'Row Level Security (RLS) is Supabase\'s killer feature for multi-tenant applications. Instead of checking permissions in your application code, you define policies directly in PostgreSQL that automatically filter every query. No matter how a user accesses the data — through your API, a direct connection, or even the Supabase dashboard — RLS policies enforce the rules.',
    content_full:
      'Row Level Security (RLS) is Supabase\'s killer feature for multi-tenant applications. Instead of checking permissions in your application code, you define policies directly in PostgreSQL that automatically filter every query. No matter how a user accesses the data — through your API, a direct connection, or even the Supabase dashboard — RLS policies enforce the rules.\n\nThe basic pattern is straightforward: enable RLS on a table, then create policies that define who can SELECT, INSERT, UPDATE, and DELETE rows. The most common pattern uses auth.uid() to match the current user\'s ID against a user_id column.\n\nBut the real power — and the real complexity — comes from advanced patterns. Cross-table policies let you check a user\'s role in one table to determine access in another. This is how you build "admins can see all rows, members can only see their own" without any application code.\n\nThe most common pitfall is the "RLS blocks my own admin operations" problem. When your server-side code needs to bypass RLS (e.g., a superadmin listing all users), you need the service_role key, not the anon key. The service_role key bypasses ALL RLS policies — use it only in trusted server-side contexts, never expose it to the client.\n\nAnother gotcha: PostgREST (which powers the Supabase client library) cannot do nested selects across tables that only share a common parent via foreign keys. If profiles and user_roles both FK to auth.users but have no direct FK between them, you can\'t do profiles(user_roles(role)). Instead, use the two-query merge pattern: fetch profiles, fetch roles, merge in JavaScript.',
    published_at: '2026-04-05T00:00:00Z',
    author: 'Tony Stark',
  },
  {
    id: 'art-004',
    slug: 'zustand-patterns-for-large-apps',
    title: 'Zustand Patterns for Large Applications',
    excerpt:
      'Selectors, slices, and store composition strategies.',
    required_tier: 'starter',
    content_preview:
      'Zustand\'s simplicity is its greatest strength — and its greatest trap. A 10-line store is beautiful. A 500-line store with 30 actions and no selectors is a performance and maintenance disaster. This article covers the patterns that keep Zustand clean as your application scales.',
    content_full:
      'Zustand\'s simplicity is its greatest strength — and its greatest trap. A 10-line store is beautiful. A 500-line store with 30 actions and no selectors is a performance and maintenance disaster. This article covers the patterns that keep Zustand clean as your application scales.\n\nThe most important pattern is selectors. When you call useStore() without a selector, your component re-renders on ANY store change. With useStore(state => state.items), it only re-renders when items changes. This distinction is invisible in small apps but devastating in large ones — a 60fps animation stuttering because a cart badge re-renders on every keystroke in a search field.\n\nFor derived state, never store computed values. If you have items in your store, compute itemCount and subtotal as selectors, not as separate state fields. Storing computed values means you need to keep them in sync with the source — an invariant that WILL break during a late-night debugging session.\n\nThe persist middleware handles localStorage serialization, but use partialize to control what gets persisted. Never persist loading states, error messages, or transient UI state. Only persist things the user would be annoyed to lose: cart contents, form drafts, preferences.\n\nFor SSR with Next.js, the hydration mismatch is the classic trap. The server renders with default state (no localStorage), the client hydrates with persisted state, and React complains about the mismatch. The fix: a hasHydrated flag in your store, gated UI that shows skeletons until hydration completes.',
    published_at: '2026-04-03T00:00:00Z',
    author: 'Tony Stark',
  },

  // PRO TIER (1)
  {
    id: 'art-005',
    slug: 'building-stripe-subscriptions-the-right-way',
    title: 'Building Stripe Subscriptions the Right Way',
    excerpt:
      'Webhooks, idempotency, and the cache-with-authoritative-source pattern.',
    required_tier: 'pro',
    content_preview:
      'Most Stripe subscription tutorials get the happy path right and everything else wrong. They show you how to create a checkout session and celebrate when the payment succeeds. But production subscription systems live in the unhappy path — failed payments, webhook retries, race conditions between redirect and webhook, and the eternal question: "Is Stripe or my database the source of truth?"',
    content_full:
      'Most Stripe subscription tutorials get the happy path right and everything else wrong. They show you how to create a checkout session and celebrate when the payment succeeds. But production subscription systems live in the unhappy path — failed payments, webhook retries, race conditions between redirect and webhook, and the eternal question: "Is Stripe or my database the source of truth?"\n\nThe answer is always: Stripe is the source of truth. Your database is a cache. Your UI reads from the cache. Webhooks keep the cache in sync. If they disagree, trust Stripe.\n\nThis means your webhook handler is the most critical piece of code in the entire subscription system. It must be idempotent (processing the same event twice produces the same result), it must handle events out of order (subscription.updated can arrive before checkout.session.completed), and it must never lose data (if it fails, Stripe retries, and your handler must pick up cleanly).\n\nThe pattern that works: store a webhook_events table with the Stripe event ID as a unique key. Before processing any event, check if you\'ve already seen it. If yes, return 200 immediately. If no, process it and insert the record. This gives you exactly-once processing semantics even with Stripe\'s at-least-once delivery guarantee.\n\nFor the redirect vs webhook race condition: when the user returns to your success page after Stripe Checkout, the webhook might not have fired yet. Don\'t query your database for the subscription status — instead, read the checkout session ID from the URL, call Stripe\'s API directly to verify the session status, and show the success page based on that. Let the webhook update your database in the background.',
    published_at: '2026-04-01T00:00:00Z',
    author: 'Tony Stark',
  },

  // ENTERPRISE TIER (1)
  {
    id: 'art-006',
    slug: 'multi-tenant-architecture-for-saas',
    title: 'Multi-Tenant Architecture for SaaS Platforms',
    excerpt:
      'Org-level subscriptions, tenant isolation, and Mothership-grade patterns.',
    required_tier: 'enterprise',
    content_preview:
      'Single-user subscriptions are straightforward: one user, one Stripe customer, one subscription, one tier. But the moment you introduce organizations — where one subscription covers multiple users — the data model, the access control, and the billing logic all become fundamentally more complex. This article covers the architectural patterns for building org-level subscriptions without painting yourself into a corner.',
    content_full:
      'Single-user subscriptions are straightforward: one user, one Stripe customer, one subscription, one tier. But the moment you introduce organizations — where one subscription covers multiple users — the data model, the access control, and the billing logic all become fundamentally more complex. This article covers the architectural patterns for building org-level subscriptions without painting yourself into a corner.\n\nThe first decision is tenant isolation strategy. Shared database with RLS policies is the most common for SaaS: all tenants share the same tables, and PostgreSQL policies ensure tenant A cannot see tenant B\'s data. This is simpler to operate than database-per-tenant but requires rigorous RLS policy design — one missing policy and you have a data breach.\n\nFor org-level subscriptions, the key insight is that the subscription belongs to the ORGANIZATION, not to any individual user. The org has a Stripe customer ID, a subscription, and a tier. Users belong to orgs. When checking tier access, you look up the user\'s org, then the org\'s subscription, then the tier.\n\nThis creates a three-hop lookup: user → org_membership → org → subscription → tier. In a hot path (every page load), you need to cache aggressively. The pattern: store the user\'s effective tier in a session claim (JWT or cookie) that gets refreshed when the org\'s subscription changes. The webhook handler that processes subscription updates must invalidate all session claims for users in that org.\n\nSeat management adds another layer. An org on a "10-seat Pro plan" needs enforcement: the 11th user invitation must fail or trigger an upgrade flow. This means your user invitation system needs to check seat counts against the subscription\'s seat limit — another cross-system integration point that most tutorials skip.',
    published_at: '2026-03-28T00:00:00Z',
    author: 'Tony Stark',
  },
];
