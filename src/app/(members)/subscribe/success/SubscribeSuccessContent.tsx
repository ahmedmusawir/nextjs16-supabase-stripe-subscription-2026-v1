'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, Loader2, Info } from 'lucide-react';
import Link from 'next/link';
import Page from '@/components/common/Page';
import Row from '@/components/common/Row';
import { Button } from '@/components/ui/button';
import { TierBadge } from '@/components/common/TierBadge';
import { createClient } from '@/utils/supabase/client';
import { tierDisplayName } from '@/lib/tiers';
import type { Subscription, SubscriptionTier } from '@/types/subscription';

interface Props {
  next: string | null;
}

type PageState = 'polling' | 'confirmed' | 'timeout';

const MAX_POLLS = 5;
const POLL_INTERVAL_MS = 2000;

const SubscribeSuccessContent = ({ next }: Props) => {
  const [pageState, setPageState] = useState<PageState>('polling');
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [pollCount, setPollCount] = useState(0);

  const checkSubscription = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data && data.tier && data.tier !== 'free') {
      setTier(data.tier as SubscriptionTier);
      setPageState('confirmed');
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const poll = async () => {
      const found = await checkSubscription();
      if (found) return;

      setPollCount((prev) => {
        const newCount = prev + 1;
        if (newCount >= MAX_POLLS) {
          setPageState('timeout');
        } else {
          timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
        }
        return newCount;
      });
    };

    poll();

    return () => clearTimeout(timeoutId);
  }, [checkSubscription]);

  const tierName = tierDisplayName(tier);
  const defaultHref = `/members-portal/${tier}`;

  // ── Polling state ──
  if (pageState === 'polling') {
    return (
      <Page className="" FULL={false}>
        <Row className="py-20 text-center max-w-lg mx-auto">
          <Loader2
            className="mx-auto mb-6 text-violet-500 animate-spin"
            size={64}
            strokeWidth={1.5}
          />
          <h1 className="text-3xl font-extrabold mb-3">
            Activating your subscription...
          </h1>
          <p className="text-muted-foreground">
            This usually takes just a few seconds.
          </p>
        </Row>
      </Page>
    );
  }

  // ── Confirmed state ──
  if (pageState === 'confirmed') {
    return (
      <Page className="" FULL={false}>
        <Row className="py-20 text-center max-w-lg mx-auto">
          <CheckCircle2
            className="mx-auto mb-6 text-green-500"
            size={64}
            strokeWidth={1.5}
          />
          <h1 className="text-3xl font-extrabold mb-3">
            Welcome to {tierName}!
          </h1>
          <div className="mb-4">
            <TierBadge tier={tier} size="md" />
          </div>
          <p className="text-muted-foreground mb-8">
            Your subscription is active. You now have access to {tierName}{' '}
            content.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              asChild
              size="lg"
              className="bg-violet-600 hover:bg-violet-700 text-white border border-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 dark:border-violet-400"
            >
              <Link href={next ?? defaultHref}>
                {next ? 'Continue' : 'Read Premium Articles'}
              </Link>
            </Button>
            <Link
              href="/members-portal/account"
              className="text-sm text-muted-foreground hover:underline"
            >
              View account
            </Link>
          </div>
        </Row>
      </Page>
    );
  }

  // ── Timeout state ──
  return (
    <Page className="" FULL={false}>
      <Row className="py-20 text-center max-w-lg mx-auto">
        <Info
          className="mx-auto mb-6 text-amber-500"
          size={64}
          strokeWidth={1.5}
        />
        <h1 className="text-3xl font-extrabold mb-3">
          Your payment was received!
        </h1>
        <p className="text-muted-foreground mb-8">
          Your subscription will activate momentarily. This page will show your
          confirmation once it&apos;s ready.
        </p>
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            onClick={() => window.location.reload()}
            className="bg-violet-600 hover:bg-violet-700 text-white border border-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 dark:border-violet-400"
          >
            Refresh
          </Button>
          <p className="text-xs text-muted-foreground">
            If this persists, check your email for confirmation from Stripe.
          </p>
        </div>
      </Row>
    </Page>
  );
};

export default SubscribeSuccessContent;
