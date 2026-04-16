import { notFound } from "next/navigation";
import Page from "@/components/common/Page";
import Row from "@/components/common/Row";
import { TierBadge } from "@/components/common/TierBadge";
import { Paywall } from "@/components/articles/Paywall";
import { articleService } from "@/services/articleService";
import { subscriptionService } from "@/services/subscriptionService";
import { meetsTier } from "@/lib/tiers";

interface Props {
  slug: string;
}

const ArticleDetailContent = async ({ slug }: Props) => {
  const article = await articleService.getBySlug(slug);
  if (!article) notFound();

  const subscription = await subscriptionService.getCurrentSubscription();
  const currentTier = subscription.tier;

  // Determine auth state for paywall
  // In v1 mock: if subscription is not 'free', user has interacted with dev toggle (treat as "authenticated")
  // For real auth check, we check if there's a session
  let isAuthenticated = false;
  try {
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    isAuthenticated = !!data.user;
  } catch {
    isAuthenticated = false;
  }

  const hasAccess = meetsTier(currentTier, article.required_tier);
  const currentPath = `/articles/${slug}`;
  const formattedDate = new Date(article.published_at).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <Page className="" FULL={false}>
      <Row className="py-8 max-w-3xl mx-auto">
        {article.required_tier !== "free" && (
          <div className="mb-4">
            <TierBadge tier={article.required_tier} size="md" />
          </div>
        )}
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
          {article.title}
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          {article.author} &middot; {formattedDate}
        </p>

        {/* Always render preview */}
        <div className="prose dark:prose-invert max-w-none">
          {article.content_preview.split("\n").map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        {/* Paywall or full content */}
        <Paywall
          required_tier={article.required_tier}
          current_tier={currentTier}
          is_authenticated={isAuthenticated}
          current_path={currentPath}
        />

        {hasAccess && (
          <div className="prose dark:prose-invert max-w-none mt-8">
            {article.content_full
              .split("\n")
              .filter((p) => p.trim())
              .map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
          </div>
        )}
      </Row>
    </Page>
  );
};

export default ArticleDetailContent;
