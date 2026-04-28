import type { SubscriptionTier } from '@/types/subscription';

const PRICE_TO_TIER: Record<string, SubscriptionTier> = {
  [process.env.STRIPE_PRICE_STARTER!]: 'starter',
  [process.env.STRIPE_PRICE_PRO!]: 'pro',
  [process.env.STRIPE_PRICE_ENTERPRISE!]: 'enterprise',
};

export function resolveTierFromPriceId(priceId: string): SubscriptionTier | null {
  return PRICE_TO_TIER[priceId] ?? null;
}

export function resolvePriceIdFromTier(tier: SubscriptionTier): string | null {
  const entry = Object.entries(PRICE_TO_TIER).find(([, t]) => t === tier);
  return entry?.[0] ?? null;
}
