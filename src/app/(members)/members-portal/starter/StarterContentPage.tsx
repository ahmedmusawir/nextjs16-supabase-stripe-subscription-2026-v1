import Page from "@/components/common/Page";
import Row from "@/components/common/Row";
import Box from "@/components/common/Box";
import { TierBadge } from "@/components/common/TierBadge";
import { requireSubscriptionTier } from "@/lib/auth/requireSubscriptionTier";

const StarterContentPage = async () => {
  await requireSubscriptionTier("starter", "/members-portal/starter");

  return (
    <Page className="" FULL={false}>
      <Row className="py-8">
        <div className="mb-4">
          <TierBadge tier="starter" size="md" />
        </div>
        <h1 className="text-3xl font-extrabold mb-4">Starter Content</h1>
        <p className="text-muted-foreground mb-8">
          Welcome to Starter content. As a Starter subscriber, you have access
          to:
        </p>

        <Box className="p-8 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
          <h2 className="text-xl font-bold mb-3">
            You&apos;re in!
          </h2>
          <p className="mb-4">
            This page is gated to Starter+ subscribers. The fact that you can
            see it means the gate is working correctly.
          </p>
          <p className="text-sm text-muted-foreground">
            In the production version, this is where starter-tier tutorials,
            guides, and foundational content would live.
          </p>
        </Box>
      </Row>
    </Page>
  );
};

export default StarterContentPage;
