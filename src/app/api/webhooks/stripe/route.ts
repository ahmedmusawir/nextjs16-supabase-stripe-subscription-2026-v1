import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe/stripe';
import { resolveTierFromPriceId } from '@/lib/stripe/tierResolver';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err);
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  const supabaseAdmin = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        const subscriptionId = session.subscription as string;
        if (!subscriptionId) {
          console.error('[webhook] No subscription ID in checkout session');
          break;
        }

        // Retrieve full subscription object from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const firstItem = subscription.items.data[0];
        const priceId = firstItem?.price.id;
        const tier = priceId ? resolveTierFromPriceId(priceId) : null;

        if (!tier) {
          console.error('[webhook] Could not resolve tier from price:', priceId);
          break;
        }

        const supabaseUserId = session.metadata?.supabase_user_id;
        if (!supabaseUserId) {
          console.error('[webhook] No supabase_user_id in session metadata');
          break;
        }

        const customerId = session.customer as string;

        const { error } = await supabaseAdmin.from('subscriptions').upsert(
          {
            user_id: supabaseUserId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            tier,
            status: subscription.status,
            current_period_start: firstItem ? new Date(firstItem.current_period_start * 1000).toISOString() : null,
            current_period_end: firstItem ? new Date(firstItem.current_period_end * 1000).toISOString() : null,
            cancel_at_period_end: subscription.cancel_at_period_end,
          },
          { onConflict: 'user_id' }
        );

        if (error) {
          console.error('[webhook] checkout.session.completed upsert error:', error);
        } else {
          console.log(`[webhook] checkout.session.completed: ${supabaseUserId} → ${tier}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const firstItem = subscription.items.data[0];
        const priceId = firstItem?.price.id;
        const tier = priceId ? resolveTierFromPriceId(priceId) : null;

        if (!tier) {
          console.error('[webhook] Could not resolve tier from price:', priceId);
          break;
        }

        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({
            tier,
            status: subscription.status,
            current_period_start: firstItem ? new Date(firstItem.current_period_start * 1000).toISOString() : null,
            current_period_end: firstItem ? new Date(firstItem.current_period_end * 1000).toISOString() : null,
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('[webhook] customer.subscription.updated error:', error);
        } else {
          console.log(`[webhook] customer.subscription.updated: ${subscription.id} → ${tier}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('[webhook] customer.subscription.deleted error:', error);
        } else {
          console.log(`[webhook] customer.subscription.deleted: ${subscription.id}`);
        }
        break;
      }

      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`[webhook] Error processing ${event.type}:`, err);
  }

  // Always return 200 to prevent Stripe retries
  return new Response('OK', { status: 200 });
}
