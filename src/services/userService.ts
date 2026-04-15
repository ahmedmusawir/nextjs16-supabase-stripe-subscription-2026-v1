import type { User } from '@/types/user';
import type { SubscriptionTier, Subscription } from '@/types/subscription';
import { useDevSubscriptionStore } from '@/store/useDevSubscriptionStore';
import { createClient } from '@/utils/supabase/server';
import { getUserRole } from '@/utils/get-user-role';

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

async function readMockTier(): Promise<SubscriptionTier> {
  if (typeof window === 'undefined') {
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
  return useDevSubscriptionStore.getState().mockTier;
}

export const userService = {
  getCurrentUser: async (): Promise<User | null> => {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return null;

    const role = await getUserRole(authUser.id);
    const tier = await readMockTier();

    return {
      id: authUser.id,
      email: authUser.email ?? '',
      role: role ?? 'member',
      subscription: buildSubscription(tier),
    };
  },
};
