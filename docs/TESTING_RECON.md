# TESTING RECON

> **Purpose:** Reference snapshot of the test infrastructure for the Architect to author the Testing Playbook.
> **Generated:** 2026-05-03
> **Branch:** `step-3-backend-3`
> **Project:** `nextjs16-supabase-stripe-subscription-2026-v1` (StarkReads)
> **Test totals at snapshot time:** 105 unit + 13 integration + 18 E2E = **136 tests, all green**

---

## § 1 TEST INFRASTRUCTURE INVENTORY

### 1.1 Unit + Integration test files (Jest)

All under `src/__tests__/`. Picked up by `npm test`. Integration subset is `src/__tests__/api/` and runs via `npm run test:integration`.

| Path | `describe()` block | Coverage |
|------|---------------------|----------|
| `src/__tests__/actions.test.ts` | `protectPage` | Server-action `protectPage` redirect/auth behavior |
| `src/__tests__/admin/actions.test.ts` | `Admin Portal Actions` | Admin-portal server actions |
| `src/__tests__/admin/AddMemberForm.test.tsx` | `AddMemberForm` | React component for adding members |
| `src/__tests__/api/checkout.test.ts` | `POST /api/checkout` | **(Integration)** Stripe Checkout route — auth, tier validation, new-user flow, upgrade flow |
| `src/__tests__/api/customer-portal.test.ts` | `POST /api/customer-portal` | **(Integration)** Stripe Billing Portal route — auth, missing customer, success |
| `src/__tests__/api/webhook.test.ts` | `POST /api/webhooks/stripe` | **(Integration)** Stripe webhook — sig verification, 3 event handlers, unknown events |
| `src/__tests__/get-user-role.test.ts` | `getUserRole` | Role-resolution utility |
| `src/__tests__/lib/pure-functions.test.ts` | `meetsTier` (+ 4 more) | Pure helpers: `meetsTier`, `tierDisplayName`, `safeRedirect`, `resolveTierFromPriceId`, `resolvePriceIdFromTier` |
| `src/__tests__/member/ProfileForm.test.tsx` | `Member ProfileForm` | Member-portal profile form |
| `src/__tests__/proxy.test.ts` | `proxy` | Reverse-proxy / route proxy logic |
| `src/__tests__/superadmin-add-user.test.ts` | `POST /api/auth/superadmin-add-user` | Superadmin user-creation API |
| `src/__tests__/superadmin/actions.test.ts` | `Superadmin Portal Actions` | Superadmin server actions |
| `src/__tests__/superadmin/AddUserForm.test.tsx` | `AddUserForm` | Superadmin add-user form |
| `src/__tests__/superadmin/EditUserForm.test.tsx` | `EditUserForm` | Superadmin edit-user form |
| `src/__tests__/superadmin/SuperadminPortalPageContent.test.tsx` | `SuperadminPortalPageContent` | Superadmin portal page |
| `src/__tests__/jest.setup.ts` | *(setup file)* | Sets default env vars + mocks `next/navigation` and `next/cache` (see § 2.7) |

**Counts:** 105 unit + 13 integration = **118 Jest tests**

### 1.2 E2E test files (Playwright)

All under `e2e/`. Run via `npm run test:e2e`. Chromium only.

| Path | `test.describe()` | Tests |
|------|-------------------|-------|
| `e2e/auth-flow.spec.ts` | `Auth Flow — Registration + Login + Logout` | 3 |
| `e2e/navbar-badge.spec.ts` | `Navbar Badge — Tier Display` | 3 |
| `e2e/paywall.spec.ts` | `Paywall — Article Access by Tier` | 4 |
| `e2e/public-access.spec.ts` | `Public Access — Anonymous Browsing` | 5 |
| `e2e/subscription-gating.spec.ts` | `Subscription Gating — Tier Access Control` | 3 |

**Total:** 18 E2E tests

### 1.3 Test helper files

| Path | Exports | Purpose |
|------|---------|---------|
| `e2e/helpers/supabase-admin.ts` | `supabaseAdmin` (singleton client) | Service-role Supabase client for E2E seeding (bypasses RLS) |
| `e2e/helpers/seed-subscription.ts` | `seedSubscription(userId, tier)`, `deleteSubscription(userId)`, `TestTier` type | Direct Supabase upsert/delete on `subscriptions` table |
| `e2e/helpers/test-user.ts` | `uniqueEmail()`, `registerUser(page, email, password?)`, `loginUser(page, email, password?)`, `getUserId(email)`, `deleteTestUser(email)` | Test-user lifecycle: timestamp-unique emails, UI register/login, admin lookup, cascade delete |

> No equivalent helper folder exists for Jest tests. Each Jest test file declares its own per-file mocks and helper functions inline (see § 2.3, § 2.4 for examples).

### 1.4 npm scripts (test-related)

From `package.json`:

```json
"scripts": {
  "test": "jest",
  "test:integration": "jest --testPathPatterns=__tests__/api",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}
```

| Script | What it does |
|--------|--------------|
| `npm test` | Runs all Jest tests (unit + integration). 118 tests. |
| `npm run test:integration` | Runs only `src/__tests__/api/**`. 13 tests. |
| `npm run test:e2e` | Runs Playwright headless. 18 tests. Auto-starts dev server via `webServer` config. |
| `npm run test:e2e:ui` | Runs Playwright in interactive UI mode (for development/debugging). |

> ⚠️ **Jest 30 gotcha:** the flag is `--testPathPatterns` (plural) — Jest ≤29 used `--testPathPattern` (singular). See § 3.5.

### 1.5 Shell-script wrappers

All under `scripts/`, all `chmod +x`, all use `#!/usr/bin/env bash` + `set -euo pipefail` + `cd "$(dirname "$0")/.."` (so they work from any cwd).

| Script | Wraps |
|--------|-------|
| `scripts/run_unit_tests.sh` | `npm test` |
| `scripts/run_stripe_integration_test.sh` | `npm run test:integration` |
| `scripts/run_e2e_tests.sh` | `npm run test:e2e` |
| `scripts/start_stripe_webhook.sh` | `stripe listen --forward-to localhost:3000/api/webhooks/stripe` |

### 1.6 Test config files

#### `jest.config.js` (verbatim)

```js
// jest.config.js
module.exports = {
  // Use ts-jest to process TypeScript files
  preset: 'ts-jest',

  // The environment in which the tests are run
  testEnvironment: 'node',

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  setupFilesAfterEnv: ['<rootDir>/src/__tests__/jest.setup.ts'],

  // A list of paths to directories that Jest should use to search for files in
  roots: ['<rootDir>/src'],

  // The testMatch patterns Jest uses to detect test files
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],

  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },

  testPathIgnorePatterns: ['/node_modules/', '/.next/', '<rootDir>/src/__tests__/jest.setup.ts'],
};
```

**Key settings explained:**

| Setting | Value | Why |
|---------|-------|-----|
| `preset` | `ts-jest` | Transforms `.ts`/`.tsx` via ts-jest, no Babel needed |
| `testEnvironment` | `node` | API/server-side tests; not `jsdom` (which is the React-component-test default) — but RTL component tests still work because the React renderer doesn't strictly require jsdom for these tests |
| `clearMocks` | `true` | Auto-resets `mock.calls`/`mock.results` between tests; **does NOT** reset `mockImplementation` / `mockReturnValue` |
| `moduleNameMapper` | `^@/(.*)$` → `<rootDir>/src/$1` | Mirrors the Next.js path alias |
| `setupFilesAfterEnv` | `[jest.setup.ts]` | Loads default env + global mocks before each test file |
| `roots` | `['<rootDir>/src']` | Confines Jest discovery to `src/` (excludes `e2e/`) |
| `testMatch` | both `__tests__/**` and `*.test.ts(x)` | Catches both flat and co-located test layouts |
| `testPathIgnorePatterns` | excludes `jest.setup.ts` | Setup file is loaded as setup, not as a test |

#### `playwright.config.ts` (verbatim)

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
```

**Key settings explained:**

| Setting | Value | Why |
|---------|-------|-----|
| `testDir` | `./e2e` | E2E specs live outside `src/` |
| `timeout` | `30000` ms | Per-test timeout (30s) |
| `retries` | `0` | No flake-masking retries — fail loud |
| `baseURL` | `http://localhost:3000` | All `page.goto('/foo')` resolve here |
| `trace` | `on-first-retry` | Capture trace only when a retry happens (currently unused since `retries: 0`) |
| `projects` | Chromium only | No cross-browser matrix (yet) |
| `webServer.command` | `npm run dev` | Auto-starts dev server before tests |
| `webServer.reuseExistingServer` | `true` | If a dev server is already running, use it (huge speedup during local iteration) |
| `webServer.timeout` | `120000` ms | Allow up to 2 min for server boot |

---

## § 2 CODE SAMPLES (verbatim from repo)

### 2.1 Unit test example — `src/__tests__/lib/pure-functions.test.ts` (full file)

> **Spec note:** Tony's recon ask was for "the `meetsTier` test — shows all 16 combinations." The actual test covers all 16 combinations (4 tiers × 4 tiers) but distributed across **6 `it` blocks** rather than 16, using `it.each` for the same-tier diagonal and grouped assertions for the off-diagonals. Coverage matrix:
>
> | required \ user | free | starter | pro | enterprise |
> |---|---|---|---|---|
> | **free** | ✓ same-tier | ✓ "starter meets free" | ✓ "pro meets free and starter" | ✓ "enterprise meets all" |
> | **starter** | ✗ "free does not meet" | ✓ same-tier | ✓ "pro meets free and starter" | ✓ "enterprise meets all" |
> | **pro** | ✗ "free does not meet" | ✗ "starter does not meet pro/ent" | ✓ same-tier | ✓ "enterprise meets all" |
> | **enterprise** | ✗ "free does not meet" | ✗ "starter does not meet pro/ent" | ✗ "pro does not meet enterprise" | ✓ same-tier |
>
> All 16 cells covered.

```ts
import { meetsTier, tierDisplayName } from '@/lib/tiers';
import { safeRedirect } from '@/lib/safeRedirect';

// tierResolver reads process.env at module scope — set before importing
process.env.STRIPE_PRICE_STARTER = 'price_test_starter';
process.env.STRIPE_PRICE_PRO = 'price_test_pro';
process.env.STRIPE_PRICE_ENTERPRISE = 'price_test_enterprise';

import {
  resolveTierFromPriceId,
  resolvePriceIdFromTier,
} from '@/lib/stripe/tierResolver';

// ─── meetsTier ───────────────────────────────────────────────

describe('meetsTier', () => {
  // Same tier always passes
  it.each(['free', 'starter', 'pro', 'enterprise'] as const)(
    '%s meets itself',
    (tier) => {
      expect(meetsTier(tier, tier)).toBe(true);
    }
  );

  // Higher tier meets lower requirement
  it('enterprise meets all tiers', () => {
    expect(meetsTier('enterprise', 'free')).toBe(true);
    expect(meetsTier('enterprise', 'starter')).toBe(true);
    expect(meetsTier('enterprise', 'pro')).toBe(true);
  });

  it('pro meets free and starter', () => {
    expect(meetsTier('pro', 'free')).toBe(true);
    expect(meetsTier('pro', 'starter')).toBe(true);
  });

  it('starter meets free', () => {
    expect(meetsTier('starter', 'free')).toBe(true);
  });

  // Lower tier does NOT meet higher requirement
  it('free does not meet any paid tier', () => {
    expect(meetsTier('free', 'starter')).toBe(false);
    expect(meetsTier('free', 'pro')).toBe(false);
    expect(meetsTier('free', 'enterprise')).toBe(false);
  });

  it('starter does not meet pro or enterprise', () => {
    expect(meetsTier('starter', 'pro')).toBe(false);
    expect(meetsTier('starter', 'enterprise')).toBe(false);
  });

  it('pro does not meet enterprise', () => {
    expect(meetsTier('pro', 'enterprise')).toBe(false);
  });
});

// ─── tierDisplayName ─────────────────────────────────────────

describe('tierDisplayName', () => {
  it.each([
    ['free', 'Free'],
    ['starter', 'Starter'],
    ['pro', 'Pro'],
    ['enterprise', 'Enterprise'],
  ] as const)('displays %s as %s', (input, expected) => {
    expect(tierDisplayName(input)).toBe(expected);
  });
});

// ─── safeRedirect ────────────────────────────────────────────

describe('safeRedirect', () => {
  it('accepts valid internal paths', () => {
    expect(safeRedirect('/pricing')).toBe('/pricing');
    expect(safeRedirect('/members-portal/pro')).toBe('/members-portal/pro');
    expect(safeRedirect('/articles?page=2')).toBe('/articles?page=2');
  });

  it('returns null for null, undefined, and empty string', () => {
    expect(safeRedirect(null)).toBeNull();
    expect(safeRedirect(undefined)).toBeNull();
    expect(safeRedirect('')).toBeNull();
  });

  it('rejects protocol-relative URLs', () => {
    expect(safeRedirect('//evil.com')).toBeNull();
    expect(safeRedirect('//evil.com/path')).toBeNull();
  });

  it('rejects schemed URLs', () => {
    expect(safeRedirect('https://evil.com')).toBeNull();
    expect(safeRedirect('http://evil.com')).toBeNull();
    expect(safeRedirect('javascript:alert(1)')).toBeNull();
  });

  it('rejects backslashes', () => {
    expect(safeRedirect('/path\\evil')).toBeNull();
    expect(safeRedirect('\\evil')).toBeNull();
  });

  it('rejects paths that do not start with /', () => {
    expect(safeRedirect('evil')).toBeNull();
    expect(safeRedirect('evil.com/path')).toBeNull();
  });
});

// ─── resolveTierFromPriceId ──────────────────────────────────

describe('resolveTierFromPriceId', () => {
  it('resolves known price IDs to tiers', () => {
    expect(resolveTierFromPriceId('price_test_starter')).toBe('starter');
    expect(resolveTierFromPriceId('price_test_pro')).toBe('pro');
    expect(resolveTierFromPriceId('price_test_enterprise')).toBe('enterprise');
  });

  it('returns null for unknown price IDs', () => {
    expect(resolveTierFromPriceId('price_unknown')).toBeNull();
    expect(resolveTierFromPriceId('')).toBeNull();
  });
});

// ─── resolvePriceIdFromTier ──────────────────────────────────

describe('resolvePriceIdFromTier', () => {
  it('resolves known tiers to price IDs', () => {
    expect(resolvePriceIdFromTier('starter')).toBe('price_test_starter');
    expect(resolvePriceIdFromTier('pro')).toBe('price_test_pro');
    expect(resolvePriceIdFromTier('enterprise')).toBe('price_test_enterprise');
  });

  it('returns null for free tier', () => {
    expect(resolvePriceIdFromTier('free')).toBeNull();
  });
});
```

### 2.2 E2E test example — `e2e/subscription-gating.spec.ts` (full file)

```ts
import { test, expect } from '@playwright/test';
import { uniqueEmail, registerUser, loginUser, getUserId, deleteTestUser } from './helpers/test-user';
import { seedSubscription, deleteSubscription } from './helpers/seed-subscription';

test.describe('Subscription Gating — Tier Access Control', () => {
  let starterEmail: string;
  let proEmail: string;
  let enterpriseEmail: string;

  test.beforeAll(async ({ browser }) => {
    starterEmail = uniqueEmail();
    proEmail = uniqueEmail();
    enterpriseEmail = uniqueEmail();

    // Register all 3 users
    for (const email of [starterEmail, proEmail, enterpriseEmail]) {
      const page = await browser.newPage();
      await registerUser(page, email);
      await page.close();
    }

    // Seed subscriptions
    const starterId = await getUserId(starterEmail);
    const proId = await getUserId(proEmail);
    const enterpriseId = await getUserId(enterpriseEmail);

    if (starterId) await seedSubscription(starterId, 'starter');
    if (proId) await seedSubscription(proId, 'pro');
    if (enterpriseId) await seedSubscription(enterpriseId, 'enterprise');
  });

  test.afterAll(async () => {
    for (const email of [starterEmail, proEmail, enterpriseEmail]) {
      await deleteTestUser(email);
    }
  });

  test('Starter user: can access starter, blocked from pro and enterprise', async ({ page }) => {
    await loginUser(page, starterEmail);

    await page.goto('/members-portal/starter');
    await expect(page.locator('h1')).toContainText('Starter Content');

    await page.goto('/members-portal/pro');
    await page.waitForURL('**/pricing**', { timeout: 10000 });

    await page.goto('/members-portal/enterprise');
    await page.waitForURL('**/pricing**', { timeout: 10000 });
  });

  test('Pro user: can access starter + pro, blocked from enterprise', async ({ page }) => {
    await loginUser(page, proEmail);

    await page.goto('/members-portal/starter');
    await expect(page.locator('h1')).toContainText('Starter Content');

    await page.goto('/members-portal/pro');
    await expect(page.locator('h1')).toContainText('Pro Content');

    await page.goto('/members-portal/enterprise');
    await page.waitForURL('**/pricing**', { timeout: 10000 });
  });

  test('Enterprise user: can access all tiers', async ({ page }) => {
    await loginUser(page, enterpriseEmail);

    await page.goto('/members-portal/starter');
    await expect(page.locator('h1')).toContainText('Starter Content');

    await page.goto('/members-portal/pro');
    await expect(page.locator('h1')).toContainText('Pro Content');

    await page.goto('/members-portal/enterprise');
    await expect(page.locator('h1')).toContainText('Enterprise Content');
  });
});
```

### 2.3 Integration test example — `src/__tests__/api/webhook.test.ts` (full file)

```ts
jest.mock('@/utils/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));

jest.mock('@/lib/stripe/stripe', () => ({
  stripe: {
    webhooks: { constructEvent: jest.fn() },
    subscriptions: { retrieve: jest.fn() },
  },
}));

jest.mock('@/lib/stripe/tierResolver', () => ({
  resolveTierFromPriceId: jest.fn(),
  resolvePriceIdFromTier: jest.fn(),
}));

import { POST } from '@/app/api/webhooks/stripe/route';
import { createAdminClient } from '@/utils/supabase/admin';
import { stripe } from '@/lib/stripe/stripe';
import { resolveTierFromPriceId } from '@/lib/stripe/tierResolver';

const createAdminClientMock = createAdminClient as jest.MockedFunction<typeof createAdminClient>;
const resolveTierFromPriceIdMock = resolveTierFromPriceId as jest.MockedFunction<typeof resolveTierFromPriceId>;

function makeRequest(opts: { body?: string; signature?: string | null }) {
  return {
    text: jest.fn().mockResolvedValue(opts.body ?? '{}'),
    headers: {
      get: jest.fn((name: string) =>
        name === 'stripe-signature' ? (opts.signature ?? null) : null
      ),
    },
  } as any;
}

function mockAdminClient() {
  const upsert = jest.fn().mockResolvedValue({ error: null });
  const eqAfterUpdate = jest.fn().mockResolvedValue({ error: null });
  const update = jest.fn(() => ({ eq: eqAfterUpdate }));
  const from = jest.fn(() => ({ upsert, update }));
  createAdminClientMock.mockReturnValue({ from } as any);
  return { from, upsert, update, eqAfterUpdate };
}

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when stripe-signature header is missing', async () => {
    mockAdminClient();

    const response = await POST(makeRequest({ body: '{}', signature: null }));

    expect(response.status).toBe(400);
    expect(stripe.webhooks.constructEvent).not.toHaveBeenCalled();
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it('returns 400 when signature verification fails', async () => {
    mockAdminClient();
    (stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const response = await POST(makeRequest({ body: '{}', signature: 'bad-sig' }));

    expect(response.status).toBe(400);
  });

  it('upserts subscription row on checkout.session.completed', async () => {
    const { from, upsert } = mockAdminClient();
    resolveTierFromPriceIdMock.mockReturnValue('pro');

    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          subscription: 'sub_xyz',
          customer: 'cus_xyz',
          metadata: { supabase_user_id: 'user-abc' },
        },
      },
    });

    (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue({
      id: 'sub_xyz',
      status: 'active',
      cancel_at_period_end: false,
      items: {
        data: [
          {
            price: { id: 'price_pro' },
            current_period_start: 1_700_000_000,
            current_period_end: 1_702_000_000,
          },
        ],
      },
    });

    const response = await POST(makeRequest({ body: '{}', signature: 'good-sig' }));

    expect(response.status).toBe(200);
    expect(from).toHaveBeenCalledWith('subscriptions');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-abc',
        stripe_customer_id: 'cus_xyz',
        stripe_subscription_id: 'sub_xyz',
        tier: 'pro',
        status: 'active',
        cancel_at_period_end: false,
        current_period_start: new Date(1_700_000_000 * 1000).toISOString(),
        current_period_end: new Date(1_702_000_000 * 1000).toISOString(),
      }),
      { onConflict: 'user_id' }
    );
  });

  it('updates existing row on customer.subscription.updated', async () => {
    const { update, eqAfterUpdate } = mockAdminClient();
    resolveTierFromPriceIdMock.mockReturnValue('enterprise');

    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_xyz',
          status: 'active',
          cancel_at_period_end: false,
          items: {
            data: [
              {
                price: { id: 'price_enterprise' },
                current_period_start: 1_700_000_000,
                current_period_end: 1_702_000_000,
              },
            ],
          },
        },
      },
    });

    const response = await POST(makeRequest({ body: '{}', signature: 'good-sig' }));

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        tier: 'enterprise',
        status: 'active',
        cancel_at_period_end: false,
      })
    );
    expect(eqAfterUpdate).toHaveBeenCalledWith('stripe_subscription_id', 'sub_xyz');
  });

  it('marks row as canceled on customer.subscription.deleted', async () => {
    const { update, eqAfterUpdate } = mockAdminClient();

    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      type: 'customer.subscription.deleted',
      data: {
        object: { id: 'sub_xyz' },
      },
    });

    const response = await POST(makeRequest({ body: '{}', signature: 'good-sig' }));

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ status: 'canceled' });
    expect(eqAfterUpdate).toHaveBeenCalledWith('stripe_subscription_id', 'sub_xyz');
  });

  it('returns 200 and writes nothing for unknown event types', async () => {
    const { from, upsert, update } = mockAdminClient();

    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      type: 'invoice.paid',
      data: { object: {} },
    });

    const response = await POST(makeRequest({ body: '{}', signature: 'good-sig' }));

    expect(response.status).toBe(200);
    expect(from).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
});
```

### 2.4 E2E helper — `e2e/helpers/seed-subscription.ts` (full file)

```ts
import { supabaseAdmin } from './supabase-admin';

export type TestTier = 'starter' | 'pro' | 'enterprise';

export async function seedSubscription(userId: string, tier: TestTier) {
  const { error } = await supabaseAdmin.from('subscriptions').upsert(
    {
      user_id: userId,
      tier,
      status: 'active',
      stripe_customer_id: `cus_test_${userId.slice(0, 8)}`,
      stripe_subscription_id: `sub_test_${userId.slice(0, 8)}`,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancel_at_period_end: false,
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    throw new Error(`Failed to seed subscription: ${error.message}`);
  }
}

export async function deleteSubscription(userId: string) {
  await supabaseAdmin.from('subscriptions').delete().eq('user_id', userId);
}
```

### 2.5 E2E helper — `e2e/helpers/test-user.ts` (full file)

```ts
import { type Page } from '@playwright/test';
import { supabaseAdmin } from './supabase-admin';

export function uniqueEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@e2e.test`;
}

export async function registerUser(
  page: Page,
  email: string,
  password: string = 'TestPassword123!'
): Promise<void> {
  await page.goto('/auth');
  await page.getByRole('tab', { name: 'Register' }).click();
  await page.locator('input[name="name"]').fill('E2E Test User');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="passwordConfirm"]').fill(password);
  await page.getByRole('button', { name: 'Signup' }).click();
  await page.waitForURL('**/members-portal', { timeout: 15000 });
}

export async function loginUser(
  page: Page,
  email: string,
  password: string = 'TestPassword123!'
): Promise<void> {
  await page.goto('/auth');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/members-portal', { timeout: 15000 });
}

export async function getUserId(email: string): Promise<string | null> {
  const { data } = await supabaseAdmin.auth.admin.listUsers();
  const user = data?.users?.find((u) => u.email === email);
  return user?.id ?? null;
}

export async function deleteTestUser(email: string): Promise<void> {
  const userId = await getUserId(email);
  if (!userId) return;

  // Delete subscription first (FK constraint)
  await supabaseAdmin.from('subscriptions').delete().eq('user_id', userId);
  // Delete user role
  await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
  // Delete auth user
  await supabaseAdmin.auth.admin.deleteUser(userId);
}
```

### 2.6 E2E helper — `e2e/helpers/supabase-admin.ts` (full file)

```ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local for Playwright (runs outside Next.js)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
```

### 2.7 Jest setup — `src/__tests__/jest.setup.ts` (full file, for completeness)

```ts
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'publishable-key';
process.env.SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || 'service-role-key';
process.env.NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

jest.mock('next/navigation', () => ({
  redirect: jest.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));
```

---

## § 3 PATTERNS AND CONVENTIONS

### 3.1 How env vars are loaded

Two completely different mechanisms for Jest vs Playwright.

**Jest (unit + integration):**
- Defaults set at the top of `src/__tests__/jest.setup.ts` using `process.env.X = process.env.X || 'fallback'` — preserves real values when present, falls back to dummies otherwise
- Loaded via `setupFilesAfterEnv: ['<rootDir>/src/__tests__/jest.setup.ts']` in `jest.config.js`
- Env vars set in setup: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`
- **Stripe-related env vars (`STRIPE_*`) are NOT in setup** — integration tests mock the entire stripe module so they're never read; pure-functions test sets them inline at module scope (see § 3.5 gotcha)

**Playwright (E2E):**
- `.env.local` is loaded by Playwright itself when starting the dev server (visible as `injected env (12) from .env.local` in the test output)
- Helper files that need direct admin access (`e2e/helpers/supabase-admin.ts`) re-load `.env.local` via `dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })` because Playwright runs the helpers outside the Next.js process
- This is why `dotenv` is a `devDependency`

### 3.2 Mocking architecture (Jest)

**The singleton mock pattern (used by all 3 integration tests):**

The Stripe SDK is wrapped in a singleton at `src/lib/stripe/stripe.ts`:

```ts
import Stripe from 'stripe';
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });
```

Routes import this singleton, not the SDK directly:

```ts
import { stripe } from '@/lib/stripe/stripe';
```

So tests mock the singleton wrapper, **not** `'stripe'`:

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

**Why this is preferable to `jest.mock('stripe')`:**
- No need to mock the `Stripe` constructor or its prototype methods
- The mock shape only includes what the route actually calls
- Avoids the `STRIPE_SECRET_KEY!` non-null assertion blowing up at module load
- Test failures point to your singleton, not the SDK internals

**Supabase mocking (server + admin clients):**

```ts
jest.mock('@/utils/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/utils/supabase/admin', () => ({ createAdminClient: jest.fn() }));
```

**Chained query mocks** — the Supabase client uses chained method calls like `from('x').select('y').eq('z', v).maybeSingle()`. These are mocked by nesting `jest.fn()` returns:

```ts
const maybeSingle = jest.fn().mockResolvedValue({ data: row });
const eq          = jest.fn(() => ({ maybeSingle }));
const select      = jest.fn(() => ({ eq }));
const upsert      = jest.fn().mockResolvedValue({ error: null });
const from        = jest.fn(() => ({ select, upsert }));   // BOTH chains live on the same `from` return
createAdminClientMock.mockReturnValue({ from } as any);
```

For terminal-await chains like `from().update({...}).eq('id', v)` (no `.maybeSingle()`), the leaf is a `mockResolvedValue`:

```ts
const eqAfterUpdate = jest.fn().mockResolvedValue({ error: null });
const update        = jest.fn(() => ({ eq: eqAfterUpdate }));
const from          = jest.fn(() => ({ update }));
```

**Resolver mocking:** the tier resolver reads `STRIPE_PRICE_*` env vars at module scope. Integration tests mock it to bypass env-var coupling:

```ts
jest.mock('@/lib/stripe/tierResolver', () => ({
  resolvePriceIdFromTier: jest.fn(),
  resolveTierFromPriceId: jest.fn(),
}));
```

Per-test, set the deterministic return: `resolvePriceIdFromTierMock.mockReturnValue('price_pro_test_123')`.

**Request/Response mocks:** built ad-hoc per test, cast `as any`:

```ts
function makeRequest(body: Record<string, unknown>) {
  return {
    json: jest.fn().mockResolvedValue(body),
    url: 'http://localhost:3000/api/checkout',
  } as any;
}
```

For webhook (uses `request.text()` and `request.headers.get()`):

```ts
function makeRequest(opts: { body?: string; signature?: string | null }) {
  return {
    text: jest.fn().mockResolvedValue(opts.body ?? '{}'),
    headers: {
      get: jest.fn((name: string) =>
        name === 'stripe-signature' ? (opts.signature ?? null) : null
      ),
    },
  } as any;
}
```

### 3.3 How test cleanup works

**Jest:**
- `clearMocks: true` in `jest.config.js` auto-resets `mock.calls` / `mock.results` between every test
- **Important:** `clearMocks` does NOT reset `mockImplementation` / `mockReturnValue` / `mockResolvedValue` — those persist. Per-test setup must redeclare them, OR use `mockResolvedValueOnce` for single-call values
- Most test files also call `jest.clearAllMocks()` in `beforeEach` for belt-and-suspenders
- No `afterEach` cleanup needed in unit/integration tests (everything is mocked, no real state)

**Playwright:**
- Per-spec `test.beforeAll()` for setup (register users, seed subscriptions)
- Per-spec `test.afterAll()` for teardown (call `deleteTestUser` for each)
- `deleteTestUser` cascades: subscriptions → user_roles → auth user (FK order matters)
- Each `test()` gets a fresh `page` — no per-test page cleanup needed
- Test users use `uniqueEmail()` (timestamp + random) so collisions are impossible even if cleanup fails

### 3.4 Test user lifecycle (E2E)

```
                ┌────────────────────────────────┐
                │ uniqueEmail()                  │
                │ → test-1714768800000-x4q2@e2e.test │
                └───────────────┬────────────────┘
                                │
                                ▼
        ┌─────────────────────────────────────────┐
        │ registerUser(page, email)               │
        │ → fills /auth Register tab → Signup     │
        │ → waits for **/members-portal redirect  │
        └───────────────────┬─────────────────────┘
                            │
                            ▼
            ┌──────────────────────────────────┐
            │ getUserId(email)                 │
            │ → supabaseAdmin.auth.admin.listUsers │
            │ → find by email → return UUID    │
            └────────────┬─────────────────────┘
                         │
                         ▼
       ┌─────────────────────────────────────────┐
       │ seedSubscription(userId, 'pro')         │
       │ → upsert into 'subscriptions' table     │
       │   with synthetic stripe_customer_id +   │
       │   stripe_subscription_id (cus_test_*,   │
       │   sub_test_*) — bypasses Stripe entirely│
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
       │   (FK order is critical)                │
       └─────────────────────────────────────────┘
```

**Why E2E uses synthetic Stripe IDs (not real Stripe sandbox):**
- `seedSubscription` writes `stripe_customer_id: cus_test_<8 chars of userId>` and `stripe_subscription_id: sub_test_<8 chars of userId>`
- These are NOT real Stripe IDs — the gating logic only reads `tier` + `status` from the row, so synthetic IDs work fine
- This decouples E2E from the Stripe sandbox (faster, no rate limits, no auth setup)
- Trade-off: E2E does NOT cover the actual Stripe round-trip — that's what integration tests (mocked) validate at the route level, and what manual 6-flow verification validates end-to-end

### 3.5 Gotchas and workarounds discovered

**(a) Jest 30 flag rename — `--testPathPattern` → `--testPathPatterns`**

Initial `package.json` script used `--testPathPattern=__tests__/api`. Failed with:

```
Option "testPathPattern" was replaced by "--testPathPatterns".
"--testPathPatterns" is only available as a command-line option.
```

Fix: pluralize the flag. Note this is **only available as a CLI option** in Jest 30, NOT as a `jest.config.js` setting.

**(b) Env vars at module scope — must be set BEFORE import**

`src/lib/stripe/tierResolver.ts` reads `process.env.STRIPE_PRICE_*` at module initialization (it builds a `Record` literal at import time). In `pure-functions.test.ts` this required:

```ts
// tierResolver reads process.env at module scope — set before importing
process.env.STRIPE_PRICE_STARTER = 'price_test_starter';
process.env.STRIPE_PRICE_PRO = 'price_test_pro';
process.env.STRIPE_PRICE_ENTERPRISE = 'price_test_enterprise';

import {
  resolveTierFromPriceId,
  resolvePriceIdFromTier,
} from '@/lib/stripe/tierResolver';
```

Order matters. ES module imports are hoisted in TS source but the **runtime** evaluation order is preserved — `process.env.X = ...` lines run before the `import` of tierResolver because ts-jest compiles to CommonJS where assignment statements interleave with `require()` calls in source order.

In integration tests this is sidestepped by mocking the resolver entirely.

**(c) Stripe SDK v22 — `current_period_start/end` on `SubscriptionItem`, not `Subscription`**

In Stripe SDK v22+, `current_period_start` and `current_period_end` moved from the `Subscription` object to each item in `subscription.items.data[*]`. The webhook code reflects this:

```ts
const firstItem = subscription.items.data[0];
// ...
current_period_start: firstItem ? new Date(firstItem.current_period_start * 1000).toISOString() : null,
current_period_end:   firstItem ? new Date(firstItem.current_period_end * 1000).toISOString() : null,
```

Mock fixtures in `webhook.test.ts` must place these on the item, not the subscription root.

**(d) Webhook always returns 200 (even on processing errors)**

By design, to prevent Stripe from infinitely retrying. Per-event errors are logged via `console.error` and swallowed. Tests assert the **DB call shape** rather than the response status for failure modes — except for the two early-exit cases (missing signature → 400, invalid signature → 400) which return before processing.

**(e) `clearMocks: true` doesn't reset implementations**

It clears `mock.calls` and `mock.results`, NOT `mockImplementation`/`mockReturnValue`/`mockResolvedValue`. If you set a return value via `.mockReturnValue()`, it persists across tests. Use `.mockReturnValueOnce()` for per-test values, OR redeclare the mock in each test's setup.

**(f) Console output in passing tests is normal**

The webhook route logs every event via `console.log` / `console.error`. Jest captures and reprints these per-test in its report. Seeing a `console.error` block under a `PASS` line is not a failure — it's the route doing its job under test. To silence per-test, wrap with `jest.spyOn(console, 'error').mockImplementation(() => {})`. Globally silenceable via `silent: true` in `jest.config.js`.

**(g) `dangerouslySetInnerHTML` not used in tests, but `as any` casts are**

The codebase prefers `html-react-parser` over `dangerouslySetInnerHTML`. In tests, `as any` is used aggressively for mock-shape casts (e.g., `createClientMock.mockResolvedValue({...} as any)`) because constructing fully-typed mocks of Supabase/Stripe response shapes is prohibitively verbose for marginal type safety value.

---

## § 4 TEST RUN COMMANDS AND EXPECTED OUTPUT

### 4.1 Commands and current results

| Command | Output (verified 2026-05-03) | Time |
|---------|------------------------------|------|
| `npm test` | `Test Suites: 15 passed, 15 total` / `Tests: 118 passed, 118 total` | ~2.9s |
| `npm run test:integration` | `Test Suites: 3 passed, 3 total` / `Tests: 13 passed, 13 total` | ~0.83s |
| `npm run test:e2e` | `18 passed (38.5s)` (2 workers, Chromium) | ~38.5s – 1.4min |
| `npm run test:e2e:ui` | Opens Playwright UI mode (interactive, no headless run) | n/a |

### 4.2 Test count breakdown

| Layer | Count | Files |
|-------|-------|-------|
| Unit | 105 | 12 Jest suites outside `__tests__/api/` |
| Integration | 13 | 3 Jest suites under `__tests__/api/` (`checkout` 4, `webhook` 6, `customer-portal` 3) |
| E2E | 18 | 5 Playwright specs (`public-access` 5, `auth-flow` 3, `subscription-gating` 3, `paywall` 4, `navbar-badge` 3) |
| **TOTAL** | **136** | — |

> Note: `npm test` runs both unit and integration (118 = 105 + 13). `npm run test:integration` is a subset filter, not a separate suite.

### 4.3 Shell-script wrappers (full code)

#### `scripts/run_unit_tests.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "▶ Running Jest unit tests..."
cd "$(dirname "$0")/.."
npm test
```

#### `scripts/run_stripe_integration_test.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "▶ Running Stripe integration tests (mocked SDK, no network)..."
cd "$(dirname "$0")/.."
npm run test:integration
```

#### `scripts/run_e2e_tests.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "▶ Running Playwright E2E tests..."
cd "$(dirname "$0")/.."
npm run test:e2e
```

#### `scripts/start_stripe_webhook.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "▶ Starting Stripe webhook forwarder → http://localhost:3000/api/webhooks/stripe"
echo "  (make sure 'npm run dev' is running in another terminal)"
echo

stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Common pattern:** all 4 scripts use `#!/usr/bin/env bash` (portability), `set -euo pipefail` (fail loud on any error / unset var / pipeline failure), and `cd "$(dirname "$0")/.."` so they work from any cwd. All `chmod +x`. No flag parsing — single-purpose by design.

### 4.4 Expected runtime characteristics

- **Jest** is fast (~3s for full unit+integration) because everything is mocked — no I/O, no network, no DB. Single Node process.
- **Playwright** runs at ~38s – 1.4min depending on machine load. 2 workers in parallel. Bottleneck is browser actions (page navigation, form fills, redirects). The dev server boot is amortized via `reuseExistingServer: true` if dev is already running.
- Total feedback loop for a full local check: ~45s – 2min. Fast enough for tight iteration.

---

*End of recon. This document reflects repo state at 2026-05-03 on branch `step-3-backend-3`.*
