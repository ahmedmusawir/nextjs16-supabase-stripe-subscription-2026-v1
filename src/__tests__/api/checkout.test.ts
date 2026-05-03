jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/utils/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));

jest.mock('@/lib/stripe/stripe', () => ({
  stripe: {
    customers: { create: jest.fn() },
    checkout: { sessions: { create: jest.fn() } },
    subscriptions: { retrieve: jest.fn(), update: jest.fn() },
  },
}));

jest.mock('@/lib/stripe/tierResolver', () => ({
  resolvePriceIdFromTier: jest.fn(),
  resolveTierFromPriceId: jest.fn(),
}));

import { POST } from '@/app/api/checkout/route';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { stripe } from '@/lib/stripe/stripe';
import { resolvePriceIdFromTier } from '@/lib/stripe/tierResolver';

const createClientMock = createClient as jest.MockedFunction<typeof createClient>;
const createAdminClientMock = createAdminClient as jest.MockedFunction<typeof createAdminClient>;
const resolvePriceIdFromTierMock = resolvePriceIdFromTier as jest.MockedFunction<typeof resolvePriceIdFromTier>;

function makeRequest(body: Record<string, unknown>) {
  return {
    json: jest.fn().mockResolvedValue(body),
    url: 'http://localhost:3000/api/checkout',
  } as any;
}

function mockAuthenticatedUser(user: { id: string; email?: string } | null) {
  createClientMock.mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user } }),
    },
  } as any);
}

function mockAdminClient(opts: {
  existingRow?: { stripe_customer_id?: string | null; stripe_subscription_id?: string | null; status?: string } | null;
  upsertResult?: { error: unknown };
}) {
  const maybeSingle = jest.fn().mockResolvedValue({ data: opts.existingRow ?? null });
  const eq = jest.fn(() => ({ maybeSingle }));
  const select = jest.fn(() => ({ eq }));
  const upsert = jest.fn().mockResolvedValue(opts.upsertResult ?? { error: null });
  const from = jest.fn(() => ({ select, upsert }));
  createAdminClientMock.mockReturnValue({ from } as any);
  return { from, select, eq, maybeSingle, upsert };
}

describe('POST /api/checkout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resolvePriceIdFromTierMock.mockReturnValue('price_pro_test_123');
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuthenticatedUser(null);

    const response = await POST(makeRequest({ tier: 'pro' }));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toMatch(/Not authenticated/);
    expect(createAdminClientMock).not.toHaveBeenCalled();
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('returns 400 when tier is invalid', async () => {
    mockAuthenticatedUser({ id: 'user-1', email: 'a@b.c' });

    const response = await POST(makeRequest({ tier: 'platinum' }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toMatch(/Invalid tier/);
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('creates a Stripe Customer and Checkout Session for a new user', async () => {
    mockAuthenticatedUser({ id: 'user-new', email: 'new@example.com' });
    mockAdminClient({ existingRow: null });

    (stripe.customers.create as jest.Mock).mockResolvedValue({ id: 'cus_new_123' });
    (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue({
      id: 'cs_test_abc',
      url: 'https://checkout.stripe.com/c/pay/cs_test_abc',
    });

    const response = await POST(makeRequest({ tier: 'pro' }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.redirect_url).toMatch(/^https:\/\/checkout\.stripe\.com/);

    expect(stripe.customers.create).toHaveBeenCalledWith({
      email: 'new@example.com',
      metadata: { supabase_user_id: 'user-new' },
    });

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        customer: 'cus_new_123',
        line_items: [{ price: 'price_pro_test_123', quantity: 1 }],
        metadata: { supabase_user_id: 'user-new', tier: 'pro' },
      })
    );

    expect(stripe.subscriptions.update).not.toHaveBeenCalled();
  });

  it('updates existing subscription (no new Checkout) when user already has an active sub', async () => {
    mockAuthenticatedUser({ id: 'user-existing', email: 'ex@example.com' });
    mockAdminClient({
      existingRow: {
        stripe_customer_id: 'cus_existing_123',
        stripe_subscription_id: 'sub_existing_123',
        status: 'active',
      },
    });

    (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue({
      id: 'sub_existing_123',
      items: { data: [{ id: 'si_existing_123' }] },
    });
    (stripe.subscriptions.update as jest.Mock).mockResolvedValue({ id: 'sub_existing_123' });

    const response = await POST(makeRequest({ tier: 'enterprise' }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.redirect_url).toBe('http://localhost:3000/subscribe/success');

    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_existing_123');
    expect(stripe.subscriptions.update).toHaveBeenCalledWith('sub_existing_123', {
      items: [{ id: 'si_existing_123', price: 'price_pro_test_123' }],
    });

    expect(stripe.customers.create).not.toHaveBeenCalled();
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });
});
