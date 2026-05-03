jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/utils/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));

jest.mock('@/lib/stripe/stripe', () => ({
  stripe: {
    billingPortal: { sessions: { create: jest.fn() } },
  },
}));

import { POST } from '@/app/api/customer-portal/route';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { stripe } from '@/lib/stripe/stripe';

const createClientMock = createClient as jest.MockedFunction<typeof createClient>;
const createAdminClientMock = createAdminClient as jest.MockedFunction<typeof createAdminClient>;

function makeRequest() {
  return {
    url: 'http://localhost:3000/api/customer-portal',
  } as any;
}

function mockAuthenticatedUser(user: { id: string } | null) {
  createClientMock.mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user } }),
    },
  } as any);
}

function mockAdminClient(row: { stripe_customer_id?: string | null } | null) {
  const maybeSingle = jest.fn().mockResolvedValue({ data: row });
  const eq = jest.fn(() => ({ maybeSingle }));
  const select = jest.fn(() => ({ eq }));
  const from = jest.fn(() => ({ select }));
  createAdminClientMock.mockReturnValue({ from } as any);
}

describe('POST /api/customer-portal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuthenticatedUser(null);

    const response = await POST(makeRequest());
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toMatch(/Not authenticated/);
    expect(createAdminClientMock).not.toHaveBeenCalled();
    expect(stripe.billingPortal.sessions.create).not.toHaveBeenCalled();
  });

  it('returns 404 when user has no stripe_customer_id', async () => {
    mockAuthenticatedUser({ id: 'user-no-sub' });
    mockAdminClient(null);

    const response = await POST(makeRequest());
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.error).toMatch(/No subscription found/);
    expect(stripe.billingPortal.sessions.create).not.toHaveBeenCalled();
  });

  it('creates a Billing Portal session and returns the redirect_url', async () => {
    mockAuthenticatedUser({ id: 'user-sub' });
    mockAdminClient({ stripe_customer_id: 'cus_portal_123' });

    (stripe.billingPortal.sessions.create as jest.Mock).mockResolvedValue({
      id: 'bps_test_abc',
      url: 'https://billing.stripe.com/p/session/test_abc',
    });

    const response = await POST(makeRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.redirect_url).toMatch(/^https:\/\/billing\.stripe\.com/);

    expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: 'cus_portal_123',
      return_url: 'http://localhost:3000/members-portal/account',
    });
  });
});
