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
