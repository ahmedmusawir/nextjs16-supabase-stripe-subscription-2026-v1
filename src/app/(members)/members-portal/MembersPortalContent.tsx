"use client";

import { useEffect, useState } from "react";
import Page from "@/components/common/Page";
import Row from "@/components/common/Row";
import Box from "@/components/common/Box";
import { Button } from "@/components/ui/button";
import { TierBadge } from "@/components/common/TierBadge";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import type { SubscriptionTier } from "@/types/subscription";

const MembersPortalContent = () => {
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>("free");

  useEffect(() => {
    const fetchTier = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("subscriptions")
        .select("tier")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data && data.tier) {
        setCurrentTier(data.tier as SubscriptionTier);
      }
    };

    fetchTier();
  }, []);
  const isFree = currentTier === "free";

  return (
    <Page className="" FULL={false}>
      <Row className="py-8">
        <h1 className="text-3xl font-extrabold mb-6">Members Portal</h1>

        {/* Subscription Summary */}
        <Box className="p-6 border dark:border-slate-700 rounded-lg mb-8 bg-white dark:bg-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Current plan:
              </span>
              <TierBadge tier={currentTier} size="md" />
            </div>
            {isFree ? (
              <Button asChild size="sm" className="bg-violet-600 hover:bg-violet-700 text-white border border-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 dark:border-violet-400">
                <Link href="/pricing">Upgrade to Pro</Link>
              </Button>
            ) : (
              <Link
                href="/members-portal/account"
                className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
              >
                Manage subscription
              </Link>
            )}
          </div>
        </Box>

        <p className="text-muted-foreground">
          Welcome to the Members Portal. Use the sidebar to browse premium
          content, manage your account, or update your profile.
        </p>
      </Row>
    </Page>
  );
};

export default MembersPortalContent;
