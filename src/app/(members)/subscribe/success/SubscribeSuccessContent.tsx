import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Page from "@/components/common/Page";
import Row from "@/components/common/Row";
import { Button } from "@/components/ui/button";
import { TierBadge } from "@/components/common/TierBadge";
import { userService } from "@/services/userService";
import { tierDisplayName } from "@/lib/tiers";
import { safeRedirect } from "@/lib/safeRedirect";

interface Props {
  searchParams: Promise<{ next?: string }>;
}

const SubscribeSuccessContent = async ({ searchParams }: Props) => {
  const user = await userService.getCurrentUser();
  const params = await searchParams;
  const safeNext = safeRedirect(params.next ?? null);

  if (!user || user.subscription.tier === "free") {
    return (
      <Page className="" FULL={false}>
        <Row className="py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-muted-foreground mb-6">
            We couldn&apos;t confirm your subscription.
          </p>
          <Button asChild className="bg-violet-600 hover:bg-violet-700 text-white border border-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 dark:border-violet-400">
            <Link href="/pricing">View Plans</Link>
          </Button>
        </Row>
      </Page>
    );
  }

  const tierName = tierDisplayName(user.subscription.tier);
  const defaultHref = `/members-portal/${user.subscription.tier}`;

  return (
    <Page className="" FULL={false}>
      <Row className="py-20 text-center max-w-lg mx-auto">
        <CheckCircle2
          className="mx-auto mb-6 text-green-500"
          size={64}
          strokeWidth={1.5}
        />
        <h1 className="text-3xl font-extrabold mb-3">
          Welcome to {tierName}!
        </h1>
        <div className="mb-4">
          <TierBadge tier={user.subscription.tier} size="md" />
        </div>
        <p className="text-muted-foreground mb-8">
          Your subscription is active. You now have access to {tierName}{" "}
          content.
        </p>
        <div className="flex flex-col gap-3">
          <Button asChild size="lg" className="bg-violet-600 hover:bg-violet-700 text-white border border-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 dark:border-violet-400">
            <Link href={safeNext ?? defaultHref}>
              {safeNext ? "Continue" : "Read Premium Articles"}
            </Link>
          </Button>
          <Link
            href="/members-portal/account"
            className="text-sm text-muted-foreground hover:underline"
          >
            View account
          </Link>
        </div>
      </Row>
    </Page>
  );
};

export default SubscribeSuccessContent;
