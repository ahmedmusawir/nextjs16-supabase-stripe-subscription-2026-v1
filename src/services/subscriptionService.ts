import type {
  Subscription,
  Plan,
  SubscriptionTier,
} from '@/types/subscription';
import { meetsTier } from '@/lib/tiers';
import { createClient } from '@/utils/supabase/server';

const PLANS: Plan[] = [
  {
    id: 'starter',
    tier: 'starter',
    name: 'Starter',
    price_monthly: 5,
    description: 'For curious readers getting started',
    features: [
      'All free articles',
      'Starter-tier premium articles',
      'Email newsletter',
    ],
    highlighted: false,
  },
  {
    id: 'pro',
    tier: 'pro',
    name: 'Pro',
    price_monthly: 15,
    description: 'For working developers who want depth',
    features: [
      'Everything in Starter',
      'Pro-tier premium articles',
      'Monthly deep-dives',
      'Community access',
    ],
    highlighted: true,
  },
  {
    id: 'enterprise',
    tier: 'enterprise',
    name: 'Enterprise',
    price_monthly: 49,
    description: 'For teams and architects',
    features: [
      'Everything in Pro',
      'Enterprise-tier articles',
      'Early access content',
      'Downloadable resources',
      'Priority support',
    ],
    highlighted: false,
  },
];

const FREE_SUBSCRIPTION: Subscription = {
  tier: 'free',
  status: 'none',
  renewal_date: null,
  started_at: null,
};

export function mapRowToSubscription(row: {
  tier: string;
  status: string;
  current_period_end: string | null;
  created_at: string | null;
}): Subscription {
  return {
    tier: row.tier as SubscriptionTier,
    status: row.status === 'active' ? 'active' : 'none',
    renewal_date: row.current_period_end ?? null,
    started_at: row.created_at ?? null,
  };
}

export const subscriptionService = {
  getCurrentSubscription: async (): Promise<Subscription> => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return FREE_SUBSCRIPTION;

    const { data } = await supabase
      .from('subscriptions')
      .select('tier, status, current_period_end, created_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!data) return FREE_SUBSCRIPTION;
    return mapRowToSubscription(data);
  },

  getPlans: async (): Promise<Plan[]> => {
    return PLANS;
  },

  hasAccess: (
    current: SubscriptionTier,
    required: SubscriptionTier
  ): boolean => {
    return meetsTier(current, required);
  },
};
