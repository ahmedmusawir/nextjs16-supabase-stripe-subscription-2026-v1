import Link from "next/link";
import Page from "@/components/common/Page";
import Row from "@/components/common/Row";
import Box from "@/components/common/Box";
import { TierBadge } from "@/components/common/TierBadge";
import { requireSubscriptionTier } from "@/lib/auth/requireSubscriptionTier";

const ProContentPage = async () => {
  await requireSubscriptionTier("pro", "/members-portal/pro");

  return (
    <Page className="" FULL={false}>
      <Row className="py-8">
        <div className="mb-4">
          <TierBadge tier="pro" size="md" />
        </div>
        <h1 className="text-3xl font-extrabold mb-4">Pro Content</h1>
        <p className="text-muted-foreground mb-8">
          Welcome to Pro content. As a Pro subscriber, you have access to:
        </p>

        <Box className="p-8 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 mb-8">
          <h2 className="text-xl font-bold mb-3">
            You&apos;re in!
          </h2>
          <p className="mb-4">
            This page is gated to Pro+ subscribers. The fact that you can see it
            means the gate is working correctly.
          </p>
          <p className="text-sm text-muted-foreground">
            In the production version, this is where deep-dive articles,
            monthly analyses, and community content would live.
          </p>
        </Box>

        <Box className="p-4 border dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          <p className="text-sm text-muted-foreground mb-2">
            You also have access to:
          </p>
          <Link
            href="/members-portal/starter"
            className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
          >
            Starter Content &rarr;
          </Link>
        </Box>
      </Row>
    </Page>
  );
};

export default ProContentPage;
