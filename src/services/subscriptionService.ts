import type {
  Subscription,
  Plan,
  SubscriptionTier,
} from '@/types/subscription';
import { meetsTier } from '@/lib/tiers';
import { mockPlans } from '@/mocks/data/plans';
import { useDevSubscriptionStore } from '@/store/useDevSubscriptionStore';

function buildSubscriptionFromTier(tier: SubscriptionTier): Subscription {
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
    renewal_date: '2026-05-15T00:00:00Z',
    started_at: '2026-04-15T00:00:00Z',
  };
}

/**
 * Reads the mock tier from the appropriate source.
 * - Server-side: reads `dev_mock_tier` cookie via dynamic import of next/headers
 * - Client-side: reads Zustand store via getState()
 */
async function readMockTier(): Promise<SubscriptionTier> {
  if (typeof window === 'undefined') {
    // Server-side: read cookie
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get('dev_mock_tier')?.value;
    if (
      cookieValue === 'free' ||
      cookieValue === 'starter' ||
      cookieValue === 'pro' ||
      cookieValue === 'enterprise'
    ) {
      return cookieValue;
    }
    return 'free';
  }
  // Client-side: read Zustand store
  return useDevSubscriptionStore.getState().mockTier;
}

export const subscriptionService = {
  getCurrentSubscription: async (): Promise<Subscription> => {
    const tier = await readMockTier();
    return buildSubscriptionFromTier(tier);
  },

  getPlans: async (): Promise<Plan[]> => {
    return mockPlans;
  },

  subscribe: async (
    tier: Exclude<SubscriptionTier, 'free'>
  ): Promise<{ redirect_url: string }> => {
    if (typeof window === 'undefined') {
      throw new Error(
        'subscriptionService.subscribe() must only be called client-side. ' +
          'In Phase 2 this becomes a server route call, but in v1 it writes to browser state.'
      );
    }
    // Mock: flip the store + cookie, return success URL
    useDevSubscriptionStore.getState().setMockTier(tier);
    document.cookie = `dev_mock_tier=${tier}; path=/; max-age=86400; samesite=lax`;
    return { redirect_url: '/subscribe/success' };
  },

  hasAccess: (
    current: SubscriptionTier,
    required: SubscriptionTier
  ): boolean => {
    return meetsTier(current, required);
  },
};
