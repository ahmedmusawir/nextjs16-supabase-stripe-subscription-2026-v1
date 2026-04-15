import type { SubscriptionTier, Subscription } from '@/types/subscription';
import type { User } from '@/types/user';
import { useDevSubscriptionStore } from '@/store/useDevSubscriptionStore';

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
    renewal_date: '2026-05-15T00:00:00Z',
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
