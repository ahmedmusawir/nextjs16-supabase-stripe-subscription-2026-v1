"use client";

import { useEffect, useState } from "react";
import Page from "@/components/common/Page";
import Row from "@/components/common/Row";
import Box from "@/components/common/Box";
import { Button } from "@/components/ui/button";
import { TierBadge } from "@/components/common/TierBadge";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import {
  useDevSubscriptionStore,
  selectMockTier,
} from "@/store/useDevSubscriptionStore";
import type { SubscriptionTier } from "@/types/subscription";
import { createClient } from "@/utils/supabase/client";

const AccountPageContent = () => {
  const { toast } = useToast();
  const currentTier = useDevSubscriptionStore(selectMockTier);
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? "");
      setIsLoading(false);
    };
    fetchUser();
  }, []);

  const isFree = currentTier === "free";
  const startedAt = isFree
    ? null
    : new Date("2026-04-15T00:00:00Z").toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
  const renewalDate = isFree
    ? null
    : new Date("2026-05-15T00:00:00Z").toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  const handleManage = () => {
    toast({
      title: "Coming soon",
      description: "Subscription management coming soon",
    });
  };

  if (isLoading) {
    return (
      <Page className="" FULL={false}>
        <Row className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-32" />
            <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </Row>
      </Page>
    );
  }

  return (
    <Page className="" FULL={false}>
      <Row className="py-8">
        <h1 className="text-3xl font-extrabold mb-8">Account</h1>

        {/* Profile Section */}
        <Box className="p-6 border dark:border-slate-700 rounded-lg mb-6 bg-white dark:bg-slate-800">
          <h2 className="text-xl font-bold mb-4">Profile</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b dark:border-slate-700">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium">{email}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Role</span>
              <span className="text-sm font-medium capitalize">Member</span>
            </div>
          </div>
        </Box>

        {/* Subscription Section */}
        <Box className="p-6 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
          <h2 className="text-xl font-bold mb-4">Subscription</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b dark:border-slate-700">
              <span className="text-sm text-muted-foreground">
                Current Plan
              </span>
              <TierBadge tier={currentTier} size="md" />
            </div>

            {!isFree && (
              <>
                <div className="flex justify-between items-center py-2 border-b dark:border-slate-700">
                  <span className="text-sm text-muted-foreground">Started</span>
                  <span className="text-sm font-medium">{startedAt}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b dark:border-slate-700">
                  <span className="text-sm text-muted-foreground">Renews</span>
                  <span className="text-sm font-medium">{renewalDate}</span>
                </div>
              </>
            )}

            {isFree && (
              <p className="text-sm text-muted-foreground py-2">
                You&apos;re on the free plan.
              </p>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            {isFree ? (
              <Button asChild className="bg-violet-600 hover:bg-violet-700 text-white border border-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 dark:border-violet-400">
                <Link href="/pricing">Subscribe</Link>
              </Button>
            ) : (
              <>
                <Button onClick={handleManage} className="bg-violet-600 hover:bg-violet-700 text-white border border-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 dark:border-violet-400">Manage Subscription</Button>
                <Button asChild variant="outline" className="border border-violet-300 dark:border-violet-500 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950">
                  <Link href="/pricing">Change Plan</Link>
                </Button>
              </>
            )}
          </div>
        </Box>
      </Row>
    </Page>
  );
};

export default AccountPageContent;
