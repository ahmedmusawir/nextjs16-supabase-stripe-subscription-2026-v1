import { TIER_LEVELS, type SubscriptionTier } from '@/types/subscription';

/**
 * Cumulative hierarchy check.
 * Returns true if `current` tier meets or exceeds `required` tier.
 *
 * Examples:
 *   meetsTier('pro', 'starter')      → true   (Pro includes Starter)
 *   meetsTier('starter', 'pro')      → false  (Starter does not include Pro)
 *   meetsTier('enterprise', 'free')  → true   (Everyone has free access)
 *   meetsTier('free', 'starter')     → false  (Free user cannot access Starter)
 */
export function meetsTier(
  current: SubscriptionTier,
  required: SubscriptionTier
): boolean {
  return TIER_LEVELS[current] >= TIER_LEVELS[required];
}

/**
 * Returns human-readable tier name for display.
 * Examples: 'free' → 'Free', 'enterprise' → 'Enterprise'
 */
export function tierDisplayName(tier: SubscriptionTier): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}
