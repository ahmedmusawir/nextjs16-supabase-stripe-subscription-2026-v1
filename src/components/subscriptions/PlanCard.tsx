'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { checkoutService } from '@/services/checkoutService';
import type { Plan, SubscriptionTier } from '@/types/subscription';
import { cn } from '@/lib/utils';

interface PlanCardProps {
  plan: Plan;
  next?: string;
}

export function PlanCard({ plan, next }: PlanCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    const result = await checkoutService.subscribe(
      plan.tier as Exclude<SubscriptionTier, 'free'>
    );

    const url = next
      ? `${result.redirect_url}${result.redirect_url.includes('?') ? '&' : '?'}next=${encodeURIComponent(next)}`
      : result.redirect_url;

    window.location.href = url;
  };

  return (
    <Card
      className={cn(
        'flex flex-col bg-white dark:bg-slate-800 border dark:border-slate-700',
        plan.highlighted &&
          'border-2 border-violet-500 dark:border-violet-400 shadow-lg relative'
      )}
    >
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-violet-600 text-white text-xs font-bold uppercase px-3 py-1 rounded-full">
            Recommended
          </span>
        </div>
      )}

      <CardHeader className={cn('text-center', plan.highlighted && 'pt-8')}>
        <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-extrabold">${plan.price_monthly}</span>
          <span className="text-muted-foreground text-base">/month</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {plan.description}
        </p>
      </CardHeader>

      <CardContent className="flex-grow">
        <div className="border-t dark:border-slate-700 pt-4">
          <ul className="space-y-3">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm">
                <Check className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleSubscribe}
          disabled={isLoading}
          variant={plan.highlighted ? 'default' : 'outline'}
          className={cn(
            'w-full border',
            plan.highlighted
              ? 'bg-violet-600 hover:bg-violet-700 text-white border-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 dark:border-violet-400'
              : 'border-violet-300 dark:border-violet-500 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Subscribing...
            </>
          ) : (
            `Subscribe to ${plan.name}`
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default PlanCard;
