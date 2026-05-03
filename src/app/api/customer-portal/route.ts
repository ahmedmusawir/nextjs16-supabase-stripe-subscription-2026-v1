import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/stripe';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 2. Look up stripe_customer_id
    const supabaseAdmin = createAdminClient();
    const { data: subRow } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!subRow?.stripe_customer_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    // 3. Create Stripe Billing Portal session
    const origin = new URL(request.url).origin;
    const session = await stripe.billingPortal.sessions.create({
      customer: subRow.stripe_customer_id,
      return_url: `${origin}/members-portal/account`,
    });

    return NextResponse.json({ redirect_url: session.url });
  } catch (error) {
    console.error('[customer-portal] Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
