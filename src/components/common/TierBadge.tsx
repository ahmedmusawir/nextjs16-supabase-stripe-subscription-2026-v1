import { Badge } from '@/components/ui/badge';
import { tierDisplayName } from '@/lib/tiers';
import type { SubscriptionTier } from '@/types/subscription';
import { cn } from '@/lib/utils';

interface TierBadgeProps {
  tier: SubscriptionTier;
  size?: 'sm' | 'md';
}

const tierStyles: Record<SubscriptionTier, string> = {
  free: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  starter: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  pro: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
  enterprise:
    'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
};

const sizeStyles = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
};

export function TierBadge({ tier, size = 'sm' }: TierBadgeProps) {
  return (
    <Badge
      className={cn(
        'border-0 font-medium',
        tierStyles[tier],
        sizeStyles[size]
      )}
    >
      {tierDisplayName(tier)}
    </Badge>
  );
}

export default TierBadge;
