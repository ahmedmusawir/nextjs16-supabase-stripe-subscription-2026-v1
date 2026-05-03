# TESTING

> **End-user testing guide for StarkReads.**
> For raw inventory and Architect-level reference, see `docs/TESTING_RECON.md`.
> **Total tests at last review:** 105 unit + 13 integration + 18 E2E = **136 tests, all green** (2026-05-03)

---

## Table of Contents

1. [Four-Layer Testing Strategy](#1-four-layer-testing-strategy)
2. [Coverage Matrix](#2-coverage-matrix)
3. [How to Run Each Test Type](#3-how-to-run-each-test-type)
4. [Test File Inventory](#4-test-file-inventory)
5. [The Singleton Mock Pattern](#5-the-singleton-mock-pattern)
6. [The Supabase Chain Mock Pattern](#6-the-supabase-chain-mock-pattern)
7. [E2E Data Seeding Strategy](#7-e2e-data-seeding-strategy)
8. [Test User Lifecycle](#8-test-user-lifecycle)
9. [Gotchas](#9-gotchas)
10. [Current Counts and Run Times](#10-current-counts-and-run-times)

---

## 1. Four-Layer Testing Strategy

The project uses a deliberate **layered approach** so each layer catches a different class of bugs:

```
       SLOW / EXPENSIVE                                        FAST / CHEAP
                                                                    ▲
       ┌───────────────────────────────────────────────────────────┤
       │  4. MANUAL                                                │
       │     Walk the 6 user flows against Stripe Sandbox          │
       │     before any production deploy.                         │
       │     Catches: real-world Stripe quirks, UX issues          │
       ├───────────────────────────────────────────────────────────┤
       │  3. E2E (Playwright) — 18 tests, ~38s                     │
       │     Real browser, real Supabase (synthetic Stripe IDs),   │
       │     auto-started dev server.                              │
       │     Catches: routing, auth flow, gating, badges, paywall  │
       ├───────────────────────────────────────────────────────────┤
       │  2. INTEGRATION (Jest, mocked SDK) — 13 tests, ~0.83s     │
       │     Mock Stripe SDK + Supabase clients. Test the API      │
       │     route handlers as units, including auth, validation,  │
       │     branch logic, and DB call shapes.                     │
       │     Catches: route logic, payload shapes, error paths     │
       ├───────────────────────────────────────────────────────────┤
       │  1. UNIT (Jest) — 105 tests, ~2.9s                        │
       │     Pure functions, server actions, components.           │
       │     Catches: logic bugs in helpers, gates, components     │
       └───────────────────────────────────────────────────────────┘
                                                                    ▼
       LATER / RARER                                          EARLIER / OFTEN
```

**Each layer is fast enough to run in a tight feedback loop. Total local test budget: ~45 seconds.**

---

## 2. Coverage Matrix

| Concern | Unit | Integration | E2E | Manual |
|---------|------|-------------|-----|--------|
| `meetsTier` and tier hierarchy | ✅ (16 combinations exhaustive) | — | ✅ (3 user flows) | — |
| `safeRedirect` | ✅ (6 cases) | — | — | — |
| `tierResolver` (price ↔ tier) | ✅ | mocked | mocked | — |
| Checkout route — auth | — | ✅ | ✅ | — |
| Checkout route — first-time | — | ✅ | — | ✅ |
| Checkout route — upgrade | — | ✅ | — | ✅ |
| Webhook route — sig verification | — | ✅ | — | — |
| Webhook route — `checkout.session.completed` | — | ✅ | — | ✅ |
| Webhook route — `customer.subscription.updated` | — | ✅ | — | ✅ |
| Webhook route — `customer.subscription.deleted` | — | ✅ | — | ✅ |
| Customer Portal route | — | ✅ | — | ✅ |
| Auth (login / register / logout) | ✅ (server actions) | — | ✅ | — |
| Subscription gating (page-level) | — | — | ✅ (Starter/Pro/Enterprise) | — |
| Paywall CTAs (anon / free / pro) | — | — | ✅ | — |
| Navbar tier badge | — | — | ✅ | — |
| Public anonymous browsing | — | — | ✅ | — |
| Admin / superadmin user CRUD | ✅ | — | — | — |
| Real Stripe round-trip | — | — | — | ✅ (only manual) |
| Email delivery (when added) | — | — | — | future |

> **Manual = the 6-flow walkthrough:** anonymous browse, register, free user gating, first-time checkout, upgrade, cancellation via Customer Portal.

---

## 3. How to Run Each Test Type

### One-line wrappers (recommended)

The `/scripts` folder contains shell wrappers — no need to remember commands:

```bash
./scripts/run_unit_tests.sh                 # 105 + 13 = 118 Jest tests
./scripts/run_stripe_integration_test.sh    # 13 integration tests only
./scripts/run_e2e_tests.sh                  # 18 Playwright tests
./scripts/start_stripe_webhook.sh           # Stripe CLI forwarder for local webhook testing
```

### npm script equivalents

| Command | What it runs | Test count | Time |
|---------|--------------|------------|------|
| `npm test` | All Jest tests (unit + integration) | 118 | ~2.9s |
| `npm run test:integration` | Just `src/__tests__/api/**` | 13 | ~0.83s |
| `npm run test:e2e` | All Playwright tests | 18 | ~38.5s |
| `npm run test:e2e:ui` | Playwright in interactive UI mode | n/a | n/a |

### Expected output

**`npm test`:**
```
Test Suites: 15 passed, 15 total
Tests:       118 passed, 118 total
Snapshots:   0 total
Time:        ~2.9 s
```

**`npm run test:integration`:**
```
Test Suites: 3 passed, 3 total
Tests:       13 passed, 13 total
Snapshots:   0 total
Time:        ~0.83 s
```

**`npm run test:e2e`:**
```
Running 18 tests using 2 workers
... (per-test ✓ lines)
18 passed (~38.5s – 1.4min)
```

> ⚠️ The webhook integration tests print `console.error` and `console.log` lines under `PASS` blocks. These are the route's own logs being captured by Jest — not test failures. See § 9 (gotcha f).

---

## 4. Test File Inventory

### Unit + Integration (Jest, in `src/__tests__/`)

| File | Tests | Coverage |
|------|-------|----------|
| `actions.test.ts` | many | `protectPage()` server action |
| `admin/actions.test.ts` | many | Admin portal server actions |
| `admin/AddMemberForm.test.tsx` | many | Admin add-member form component |
| `api/checkout.test.ts` | **4** | Stripe Checkout route — auth, tier validation, new-user flow, upgrade flow |
| `api/customer-portal.test.ts` | **3** | Stripe Billing Portal route — auth, missing customer, success |
| `api/webhook.test.ts` | **6** | Stripe webhook — sig missing, sig invalid, 3 event handlers, unknown event |
| `get-user-role.test.ts` | many | `getUserRole()` utility |
| `lib/pure-functions.test.ts` | many | `meetsTier`, `tierDisplayName`, `safeRedirect`, `resolveTierFromPriceId`, `resolvePriceIdFromTier` |
| `member/ProfileForm.test.tsx` | many | Member profile form |
| `proxy.test.ts` | many | Reverse proxy logic |
| `superadmin-add-user.test.ts` | many | Superadmin user-creation API |
| `superadmin/actions.test.ts` | many | Superadmin server actions |
| `superadmin/AddUserForm.test.tsx` | many | Superadmin add-user form |
| `superadmin/EditUserForm.test.tsx` | many | Superadmin edit-user form |
| `superadmin/SuperadminPortalPageContent.test.tsx` | many | Superadmin portal page |
| `jest.setup.ts` | — | Setup file: env defaults + mocks for `next/navigation` and `next/cache` |

**Integration subset:** the 3 files under `src/__tests__/api/` (13 tests total).

### E2E (Playwright, in `e2e/`)

| File | Tests | Coverage |
|------|-------|----------|
| `auth-flow.spec.ts` | 3 | Register → portal, logout → blocked, login → portal |
| `navbar-badge.spec.ts` | 3 | Tier badges (Free / Starter / Pro) display correctly |
| `paywall.spec.ts` | 4 | Anonymous CTA, free user CTA, Pro user full content, Pro → Enterprise CTA |
| `public-access.spec.ts` | 5 | Hero, articles grid, free article full, gated article preview + paywall, pricing cards |
| `subscription-gating.spec.ts` | 3 | Starter/Pro/Enterprise users can access exactly their tier and below |

### Helpers (in `e2e/helpers/`)

- `supabase-admin.ts` — service-role Supabase client for E2E seeding (loads `.env.local` via `dotenv`)
- `seed-subscription.ts` — `seedSubscription(userId, tier)` and `deleteSubscription(userId)`
- `test-user.ts` — `uniqueEmail()`, `registerUser()`, `loginUser()`, `getUserId()`, `deleteTestUser()`

---

## 5. The Singleton Mock Pattern

**The single most important pattern for testing the Stripe routes.** Mock the singleton wrapper, not the SDK.

### Why

The Stripe SDK is wrapped in a singleton at `src/lib/stripe/stripe.ts`:

```ts
import Stripe from 'stripe';
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });
```

Routes import this singleton:

```ts
import { stripe } from '@/lib/stripe/stripe';
```

So tests mock the singleton, **not** `'stripe'` itself:

```ts
jest.mock('@/lib/stripe/stripe', () => ({
  stripe: {
    customers: { create: jest.fn() },
    checkout: { sessions: { create: jest.fn() } },
    subscriptions: { retrieve: jest.fn(), update: jest.fn() },
    webhooks: { constructEvent: jest.fn() },
    billingPortal: { sessions: { create: jest.fn() } },
  },
}));
```

### Why this beats `jest.mock('stripe')`

- No need to mock the `Stripe` constructor or its prototype methods
- Mock shape only includes what the route actually calls
- Avoids the `STRIPE_SECRET_KEY!` non-null assertion blowing up at module load
- Test failures point to your singleton, not the SDK internals

### Per-test setup

```ts
// In a test:
(stripe.customers.create as jest.Mock).mockResolvedValue({ id: 'cus_new_123' });
(stripe.checkout.sessions.create as jest.Mock).mockResolvedValue({
  id: 'cs_test_abc',
  url: 'https://checkout.stripe.com/c/pay/cs_test_abc',
});
```

Then assert what the route called Stripe with:

```ts
expect(stripe.customers.create).toHaveBeenCalledWith({
  email: 'new@example.com',
  metadata: { supabase_user_id: 'user-new' },
});
```

### Also mock the tierResolver

The tier resolver reads `STRIPE_PRICE_*` at module scope. Tests bypass that by mocking it too:

```ts
jest.mock('@/lib/stripe/tierResolver', () => ({
  resolvePriceIdFromTier: jest.fn(),
  resolveTierFromPriceId: jest.fn(),
}));

// In a test:
resolvePriceIdFromTierMock.mockReturnValue('price_pro_test_123');
```

---

## 6. The Supabase Chain Mock Pattern

The Supabase JS client uses chained method calls (`from('x').select('y').eq('z', v).maybeSingle()`). Mock these by **nesting** `jest.fn()` returns.

### For chains ending in `maybeSingle()` (returns a thenable)

```ts
const maybeSingle = jest.fn().mockResolvedValue({ data: row });
const eq          = jest.fn(() => ({ maybeSingle }));
const select      = jest.fn(() => ({ eq }));
const upsert      = jest.fn().mockResolvedValue({ error: null });
const from        = jest.fn(() => ({ select, upsert }));   // BOTH chains live on the same `from`
createAdminClientMock.mockReturnValue({ from } as any);
```

The trick is that `from(...)` returns an object exposing **all the methods that might be called on it** (`select` AND `upsert`), so chained calls each pick the right path.

### For chains like `from().update({...}).eq('id', v)` (await on the leaf)

```ts
const eqAfterUpdate = jest.fn().mockResolvedValue({ error: null });
const update        = jest.fn(() => ({ eq: eqAfterUpdate }));
const from          = jest.fn(() => ({ update }));
createAdminClientMock.mockReturnValue({ from } as any);
```

### Helper functions in test files

To keep individual tests readable, each integration test file declares a local helper:

```ts
function mockAdminClient(opts: { existingRow?: ... }) {
  // … build the mock chain …
  return { from, select, eq, maybeSingle, upsert };
}

// In a test:
const { upsert } = mockAdminClient({ existingRow: null });
expect(upsert).toHaveBeenCalledWith(...);
```

See `src/__tests__/api/checkout.test.ts` and `src/__tests__/api/webhook.test.ts` for full examples.

---

## 7. E2E Data Seeding Strategy

E2E tests need users with specific tiers (Starter, Pro, Enterprise). Real Stripe round-trips would be too slow and brittle. The strategy: **bypass Stripe entirely and write directly to Supabase with synthetic IDs.**

### What "synthetic Stripe IDs" means

`seedSubscription(userId, 'pro')` writes:

```ts
{
  user_id,
  tier: 'pro',
  status: 'active',
  stripe_customer_id: `cus_test_${userId.slice(0, 8)}`,
  stripe_subscription_id: `sub_test_${userId.slice(0, 8)}`,
  current_period_start: now,
  current_period_end: now + 30 days,
  cancel_at_period_end: false,
}
```

The `cus_test_*` and `sub_test_*` IDs are **NOT real Stripe IDs**. The gating logic only reads `tier` and `status` from the row, so synthetic IDs work fine.

### Trade-off

- ✅ E2E is fast, deterministic, no Stripe rate limits, no auth setup with Stripe Sandbox
- ❌ E2E does **not** cover the Stripe round-trip itself
- That gap is filled by:
  - **Integration tests** (mocked SDK) — verifies the route logic and call shapes
  - **Manual 6-flow walkthrough** — verifies the actual Stripe round-trip end-to-end

---

## 8. Test User Lifecycle

```
                ┌────────────────────────────────────┐
                │ uniqueEmail()                      │
                │ → test-1714768800000-x4q2@e2e.test │
                └─────────────────┬──────────────────┘
                                  │
                                  ▼
        ┌────────────────────────────────────────────┐
        │ registerUser(page, email)                  │
        │ → fills /auth Register tab → Signup        │
        │ → waits for **/members-portal redirect     │
        │ → handle_new_user trigger creates          │
        │   user_roles + profiles rows automatically │
        └─────────────────┬──────────────────────────┘
                          │
                          ▼
            ┌─────────────────────────────────┐
            │ getUserId(email)                │
            │ → supabaseAdmin.auth.admin      │
            │   .listUsers → find by email    │
            └────────────┬────────────────────┘
                         │
                         ▼
       ┌─────────────────────────────────────────┐
       │ seedSubscription(userId, 'pro')         │
       │ → upsert into 'subscriptions' table     │
       │   with synthetic stripe_customer_id +   │
       │   stripe_subscription_id                │
       └─────────────────┬───────────────────────┘
                         │
                         ▼
                ┌────────────────────┐
                │ TEST RUNS — uses   │
                │ loginUser to drive │
                │ the page as user   │
                └────────┬───────────┘
                         │
                         ▼
       ┌─────────────────────────────────────────┐
       │ deleteTestUser(email) (afterAll)        │
       │ 1. delete from subscriptions WHERE …    │
       │ 2. delete from user_roles WHERE …       │
       │ 3. supabaseAdmin.auth.admin.deleteUser  │
       │   (FK order is critical — children      │
       │    first, then auth.users which would   │
       │    cascade-delete anyway, but explicit  │
       │    delete is faster and clearer)        │
       └─────────────────────────────────────────┘
```

---

## 9. Gotchas

### (a) Jest 30 flag rename — `--testPathPattern` → `--testPathPatterns`

Jest 30 renamed the singular flag. The fix is the plural form, **only available as a CLI option** (NOT in `jest.config.js`):

```json
"test:integration": "jest --testPathPatterns=__tests__/api"
```

### (b) Env vars at module scope must be set BEFORE import

`src/lib/stripe/tierResolver.ts` reads `process.env.STRIPE_PRICE_*` at module initialization (it builds a `Record` literal at import time). The pure-functions test sets them inline:

```ts
process.env.STRIPE_PRICE_STARTER = 'price_test_starter';
process.env.STRIPE_PRICE_PRO = 'price_test_pro';
process.env.STRIPE_PRICE_ENTERPRISE = 'price_test_enterprise';

import {
  resolveTierFromPriceId,
  resolvePriceIdFromTier,
} from '@/lib/stripe/tierResolver';   // ← MUST come after the env assignments
```

In integration tests this is sidestepped by mocking the resolver entirely.

### (c) Stripe SDK v22 — `current_period_*` on `SubscriptionItem`, not `Subscription`

In v22+, period dates moved from the Subscription object to each item. Mock fixtures must place them on the item:

```ts
items: {
  data: [{
    price: { id: 'price_pro' },
    current_period_start: 1_700_000_000,   // ← here, not on subscription root
    current_period_end:   1_702_000_000,
  }],
}
```

### (d) Webhook always returns 200

By design, to prevent Stripe retries. Per-event errors are logged and swallowed. Tests assert the **DB call shape**, not just the response status, for failure modes — except the two early-exit cases (missing signature, invalid signature) which return 400 before processing.

### (e) `clearMocks: true` doesn't reset implementations

`clearMocks` clears `mock.calls` and `mock.results` between tests, but **not** `mockImplementation` / `mockReturnValue` / `mockResolvedValue`. Use `mockReturnValueOnce` for per-test values, OR redeclare the mock in each test's setup.

### (f) Console output in passing tests is normal

The webhook route logs every event via `console.log` / `console.error`. Jest captures and reprints these per-test in its report. Seeing a `console.error` block under a `PASS` line is **not a failure** — it's the route doing its job under test.

To silence per-test:
```ts
jest.spyOn(console, 'error').mockImplementation(() => {});
```

To silence globally: add `silent: true` to `jest.config.js` (not currently done).

### (g) `as any` casts in mock construction

The codebase uses `as any` aggressively for mock-shape casts (e.g., `createClientMock.mockResolvedValue({...} as any)`). Constructing fully-typed mocks of Supabase/Stripe response shapes is prohibitively verbose for marginal type-safety value. Convention: the test surface uses `as any`; production code does not.

---

## 10. Current Counts and Run Times

(Verified 2026-05-03)

| Layer | Tests | Files | Time | Command |
|-------|-------|-------|------|---------|
| Unit | 105 | 12 suites | 2.9s | `npm test` (combined with integration) |
| Integration | 13 | 3 suites | 0.83s | `npm run test:integration` |
| E2E | 18 | 5 specs | 38.5s | `npm run test:e2e` |
| **TOTAL** | **136** | **20 files** | **~45s** | (run all in series) |

### Total local feedback loop

- Run unit + integration: **~3 seconds** (every save while iterating)
- Run E2E: **~40 seconds** (before commit)
- Total commit gate: **~45 seconds**

---

## See Also

- `docs/TESTING_RECON.md` — raw inventory and verbatim code samples (Architect-level reference)
- `docs/API_REFERENCE.md` — what each route does that the integration tests verify
- `docs/SUBSCRIPTION_SYSTEM.md` — the system the tests are guarding
- `docs/DEVELOPMENT_GUIDE.md` — how to add tests when adding new features
