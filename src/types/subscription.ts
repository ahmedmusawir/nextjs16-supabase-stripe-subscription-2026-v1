export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'enterprise';

export const TIER_LEVELS: Record<SubscriptionTier, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  enterprise: 3,
} as const;

export interface Subscription {
  tier: SubscriptionTier;
  status: 'active' | 'none';
  renewal_date: string | null;
  started_at: string | null;
}

export interface Plan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  price_monthly: number;
  description: string;
  features: string[];
  highlighted: boolean;
}
