"use client";

import { useEffect, useState } from "react";
import Page from "@/components/common/Page";
import Row from "@/components/common/Row";
import Box from "@/components/common/Box";
import { Button } from "@/components/ui/button";
import { TierBadge } from "@/components/common/TierBadge";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import type { SubscriptionTier } from "@/types/subscription";
import { createClient } from "@/utils/supabase/client";

const AccountPageContent = () => {
  const { toast } = useToast();
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>("free");
  const [email, setEmail] = useState<string>("");
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [renewalDate, setRenewalDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? "");

      if (data.user) {
        const { data: subRow } = await supabase
          .from("subscriptions")
          .select("tier, created_at, current_period_end")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (subRow && subRow.tier) {
          setCurrentTier(subRow.tier as SubscriptionTier);
          if (subRow.created_at) {
            setStartedAt(
              new Date(subRow.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            );
          }
          if (subRow.current_period_end) {
            setRenewalDate(
              new Date(subRow.current_period_end).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            );
          }
        }
      }

      setIsLoading(false);
    };
    fetchData();
  }, []);

  const isFree = currentTier === "free";

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
                {startedAt && (
                  <div className="flex justify-between items-center py-2 border-b dark:border-slate-700">
                    <span className="text-sm text-muted-foreground">Started</span>
                    <span className="text-sm font-medium">{startedAt}</span>
                  </div>
                )}
                {renewalDate && (
                  <div className="flex justify-between items-center py-2 border-b dark:border-slate-700">
                    <span className="text-sm text-muted-foreground">Renews</span>
                    <span className="text-sm font-medium">{renewalDate}</span>
                  </div>
                )}
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
