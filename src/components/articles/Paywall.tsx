import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { meetsTier, tierDisplayName } from '@/lib/tiers';
import type { SubscriptionTier } from '@/types/subscription';

interface PaywallProps {
  required_tier: SubscriptionTier;
  current_tier: SubscriptionTier;
  is_authenticated: boolean;
  current_path: string;
}

export function Paywall({
  required_tier,
  current_tier,
  is_authenticated,
  current_path,
}: PaywallProps) {
  if (meetsTier(current_tier, required_tier)) {
    return null;
  }

  const isAnonymous = !is_authenticated;
  const ctaHref = isAnonymous
    ? `/auth?next=${encodeURIComponent(current_path)}`
    : `/pricing?next=${encodeURIComponent(current_path)}`;
  const ctaLabel = isAnonymous
    ? 'Sign up to read'
    : `Upgrade to ${tierDisplayName(required_tier)}`;
  const bodyText = isAnonymous
    ? `Sign up for a ${tierDisplayName(required_tier)} subscription to keep reading.`
    : `Upgrade to ${tierDisplayName(required_tier)} to keep reading.`;

  return (
    <div className="relative -mt-32 pt-32 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-slate-900 dark:via-slate-900/95">
      <div className="p-8 text-center max-w-md mx-auto bg-slate-50 dark:bg-slate-800/50 border dark:border-slate-700 rounded-lg">
        <Lock className="mx-auto mb-4 text-muted-foreground" size={32} />
        <h3 className="text-lg font-semibold mb-2">
          This is {tierDisplayName(required_tier)} content
        </h3>
        <p className="text-muted-foreground text-sm mb-6">{bodyText}</p>
        <Button asChild className="w-full">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      </div>
    </div>
  );
}

export default Paywall;
