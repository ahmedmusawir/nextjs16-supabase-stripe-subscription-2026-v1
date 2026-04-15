import { redirect } from 'next/navigation';
import type { SubscriptionTier } from '@/types/subscription';
import type { User } from '@/types/user';
import { meetsTier } from '@/lib/tiers';
import { userService } from '@/services/userService';

/**
 * Server-side route protection by subscription tier.
 * Mirrors the pattern of protectPage() from the RBAC starter kit.
 *
 * If user is not logged in → redirect to /auth?next=<currentPath>
 * If user's tier is below required → redirect to /pricing?next=<currentPath>
 * If tier check passes → returns the User object for use in the page
 *
 * In v1 (prototype): reads mock tier from `dev_mock_tier` cookie.
 * In Phase 2: reads real subscription from Supabase.
 *
 * @param required - Minimum tier needed to access this route
 * @param currentPath - The current route path (for ?next= redirect chain)
 */
export async function requireSubscriptionTier(
  required: SubscriptionTier,
  currentPath: string
): Promise<User> {
  const user = await userService.getCurrentUser();

  if (!user) {
    redirect(`/auth?next=${encodeURIComponent(currentPath)}`);
  }

  if (!meetsTier(user.subscription.tier, required)) {
    redirect(`/pricing?next=${encodeURIComponent(currentPath)}`);
  }

  return user;
}
