import type { SubscriptionTier } from '@/types/subscription';

/**
 * Client-safe checkout service.
 * Separated from subscriptionService because subscribe() runs in the browser
 * while getCurrentSubscription() uses server-only Supabase client.
 * Next.js App Router enforces this split — server imports can't be in
 * client component dependency chains.
 */
export const checkoutService = {
  subscribe: async (
    tier: Exclude<SubscriptionTier, 'free'>
  ): Promise<{ redirect_url: string }> => {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to start checkout');
    }

    const data = await response.json();
    return { redirect_url: data.redirect_url };
  },
};
