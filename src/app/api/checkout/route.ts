import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/stripe';
import { resolvePriceIdFromTier } from '@/lib/stripe/tierResolver';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { safeRedirect } from '@/lib/safeRedirect';
import type { SubscriptionTier } from '@/types/subscription';

const VALID_TIERS: SubscriptionTier[] = ['starter', 'pro', 'enterprise'];

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const { tier, next } = body as { tier: string; next?: string };

    if (!tier || !VALID_TIERS.includes(tier as SubscriptionTier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // 3. Validate next param if present
    const validatedNext = next ? safeRedirect(next) : null;

    // 4. Resolve tier to Stripe Price ID
    const priceId = resolvePriceIdFromTier(tier as SubscriptionTier);
    if (!priceId) {
      return NextResponse.json({ error: 'Price not configured for tier' }, { status: 400 });
    }

    // 5. Look up existing subscription row
    const supabaseAdmin = createAdminClient();
    const { data: existingRow } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id, status')
      .eq('user_id', user.id)
      .maybeSingle();

    let stripeCustomerId = existingRow?.stripe_customer_id;

    // 6. If user has an active subscription, UPDATE it (upgrade/downgrade)
    if (existingRow?.stripe_subscription_id && existingRow.status === 'active') {
      const existingSub = await stripe.subscriptions.retrieve(existingRow.stripe_subscription_id);
      const existingItemId = existingSub.items.data[0]?.id;

      if (!existingItemId) {
        return NextResponse.json({ error: 'Could not find subscription item' }, { status: 500 });
      }

      await stripe.subscriptions.update(existingRow.stripe_subscription_id, {
        items: [{ id: existingItemId, price: priceId }],
      });

      // Webhook handles customer.subscription.updated → updates Supabase row
      // Redirect to success page (no Stripe Checkout needed for upgrades)
      const origin = new URL(request.url).origin;
      const successUrl = validatedNext
        ? `${origin}/subscribe/success?next=${encodeURIComponent(validatedNext)}`
        : `${origin}/subscribe/success`;

      return NextResponse.json({ redirect_url: successUrl });
    }

    // 7. First-time subscriber: create Stripe Customer if needed
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      stripeCustomerId = customer.id;

      await supabaseAdmin.from('subscriptions').upsert(
        {
          user_id: user.id,
          stripe_customer_id: stripeCustomerId,
          tier: tier,
          status: 'incomplete',
        },
        { onConflict: 'user_id' }
      );
    }

    // 8. Build success/cancel URLs
    const origin = new URL(request.url).origin;
    const successUrl = validatedNext
      ? `${origin}/subscribe/success?next=${encodeURIComponent(validatedNext)}`
      : `${origin}/subscribe/success`;
    const cancelUrl = validatedNext
      ? `${origin}/pricing?next=${encodeURIComponent(validatedNext)}`
      : `${origin}/pricing`;

    // 9. Create Stripe Checkout Session (first-time subscribers only)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { supabase_user_id: user.id, tier },
    });

    return NextResponse.json({ redirect_url: session.url });
  } catch (error) {
    console.error('[checkout] Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
