import Link from "next/link";
import Page from "@/components/common/Page";
import Row from "@/components/common/Row";
import Box from "@/components/common/Box";
import { TierBadge } from "@/components/common/TierBadge";
import { requireSubscriptionTier } from "@/lib/auth/requireSubscriptionTier";

const EnterpriseContentPage = async () => {
  await requireSubscriptionTier("enterprise", "/members-portal/enterprise");

  return (
    <Page className="" FULL={false}>
      <Row className="py-8">
        <div className="mb-4">
          <TierBadge tier="enterprise" size="md" />
        </div>
        <h1 className="text-3xl font-extrabold mb-4">Enterprise Content</h1>
        <p className="text-muted-foreground mb-8">
          Welcome to Enterprise content. As an Enterprise subscriber, you have
          access to everything:
        </p>

        <Box className="p-8 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 mb-8">
          <h2 className="text-xl font-bold mb-3">
            You&apos;re in!
          </h2>
          <p className="mb-4">
            This page is gated to Enterprise subscribers only. The fact that you
            can see it means the gate is working correctly.
          </p>
          <p className="text-sm text-muted-foreground">
            In the production version, this is where architecture deep-dives,
            early access content, downloadable resources, and priority support
            would live.
          </p>
        </Box>

        <Box className="p-4 border dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          <p className="text-sm text-muted-foreground mb-2">
            You also have access to:
          </p>
          <div className="flex flex-col gap-1">
            <Link
              href="/members-portal/starter"
              className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
            >
              Starter Content &rarr;
            </Link>
            <Link
              href="/members-portal/pro"
              className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
            >
              Pro Content &rarr;
            </Link>
          </div>
        </Box>
      </Row>
    </Page>
  );
};

export default EnterpriseContentPage;
