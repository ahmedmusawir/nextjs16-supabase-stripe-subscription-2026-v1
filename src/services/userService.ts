import type { User } from '@/types/user';
import type { Subscription, SubscriptionTier } from '@/types/subscription';
import { createClient } from '@/utils/supabase/server';
import { getUserRole } from '@/utils/get-user-role';

const FREE_SUBSCRIPTION: Subscription = {
  tier: 'free',
  status: 'none',
  renewal_date: null,
  started_at: null,
};

export const userService = {
  getCurrentUser: async (): Promise<User | null> => {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return null;

    const role = await getUserRole(authUser.id);

    // Query real subscription from Supabase
    const { data: subRow } = await supabase
      .from('subscriptions')
      .select('tier, status, current_period_end, created_at')
      .eq('user_id', authUser.id)
      .maybeSingle();

    let subscription: Subscription;
    if (!subRow) {
      subscription = FREE_SUBSCRIPTION;
    } else {
      subscription = {
        tier: subRow.tier as SubscriptionTier,
        status: subRow.status === 'active' ? 'active' : 'none',
        renewal_date: subRow.current_period_end ?? null,
        started_at: subRow.created_at ?? null,
      };
    }

    return {
      id: authUser.id,
      email: authUser.email ?? '',
      role: role ?? 'member',
      subscription,
    };
  },
};
