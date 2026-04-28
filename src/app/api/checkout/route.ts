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

    // 5. Look up or create Stripe Customer
    const supabaseAdmin = createAdminClient();
    const { data: existingRow } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let stripeCustomerId = existingRow?.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      stripeCustomerId = customer.id;

      // Upsert placeholder row so we don't lose the customer ID
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

    // 6. Build success/cancel URLs
    const origin = new URL(request.url).origin;
    const successUrl = validatedNext
      ? `${origin}/subscribe/success?next=${encodeURIComponent(validatedNext)}`
      : `${origin}/subscribe/success`;
    const cancelUrl = validatedNext
      ? `${origin}/pricing?next=${encodeURIComponent(validatedNext)}`
      : `${origin}/pricing`;

    // 7. Create Stripe Checkout Session
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
