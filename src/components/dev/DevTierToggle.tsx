'use client';

import { useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useDevSubscriptionStore,
  selectMockTier,
  selectSetMockTier,
} from '@/store/useDevSubscriptionStore';
import type { SubscriptionTier } from '@/types/subscription';
import { cn } from '@/lib/utils';

const tiers: SubscriptionTier[] = ['free', 'starter', 'pro', 'enterprise'];

const tierLabels: Record<SubscriptionTier, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

export function DevTierToggle() {
  const currentTier = useDevSubscriptionStore(selectMockTier);
  const setMockTier = useDevSubscriptionStore(selectSetMockTier);
  const router = useRouter();

  const handleTierChange = (tier: SubscriptionTier) => {
    // 1. Update Zustand (client-side, immediate)
    setMockTier(tier);

    // 2. Set cookie (server-side, next request)
    document.cookie = `dev_mock_tier=${tier}; path=/; max-age=86400; samesite=lax`;

    // 3. Refresh server components
    router.refresh();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-56 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-xl p-3">
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-700 dark:text-slate-200">
        <Settings size={14} />
        <span>Dev: Mock Tier</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {tiers.map((tier) => (
          <Button
            key={tier}
            size="sm"
            variant={currentTier === tier ? 'default' : 'outline'}
            onClick={() => handleTierChange(tier)}
            className={cn(
              'text-xs h-8',
              currentTier === tier &&
                'bg-violet-600 hover:bg-violet-700 text-white'
            )}
          >
            {tierLabels[tier]}
          </Button>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 text-center">
        Dev only — not in production
      </p>
    </div>
  );
}

export default DevTierToggle;
