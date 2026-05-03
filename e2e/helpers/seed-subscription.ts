import { supabaseAdmin } from './supabase-admin';

export type TestTier = 'starter' | 'pro' | 'enterprise';

export async function seedSubscription(userId: string, tier: TestTier) {
  const { error } = await supabaseAdmin.from('subscriptions').upsert(
    {
      user_id: userId,
      tier,
      status: 'active',
      stripe_customer_id: `cus_test_${userId.slice(0, 8)}`,
      stripe_subscription_id: `sub_test_${userId.slice(0, 8)}`,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancel_at_period_end: false,
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    throw new Error(`Failed to seed subscription: ${error.message}`);
  }
}

export async function deleteSubscription(userId: string) {
  await supabaseAdmin.from('subscriptions').delete().eq('user_id', userId);
}
