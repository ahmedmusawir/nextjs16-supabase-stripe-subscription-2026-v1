import type { Plan } from '@/types/subscription';

export const mockPlans: Plan[] = [
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
