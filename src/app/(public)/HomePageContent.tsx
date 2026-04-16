import Page from "@/components/common/Page";
import Row from "@/components/common/Row";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { articleService } from "@/services/articleService";

const HomePageContent = async () => {
  const recentArticles = await articleService.getRecent(3);

  return (
    <Page className="" FULL={false}>
      {/* Section A — Hero */}
      <Row className="text-center py-20">
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-indigo-400">
          StarkReads
        </h1>
        <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
          Premium tech writing for working developers.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-violet-600 hover:bg-violet-700 text-white border border-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 dark:border-violet-400">
            <Link href="/pricing">See Pricing</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border border-violet-300 dark:border-violet-500 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950">
            <Link href="/articles">Browse Articles</Link>
          </Button>
        </div>
      </Row>

      {/* Section B — Recent Articles */}
      <Row className="py-12">
        <h2 className="text-2xl font-bold mb-6">Recent Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
        <div className="mt-6 text-right">
          <Link
            href="/articles"
            className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
          >
            View all articles &rarr;
          </Link>
        </div>
      </Row>

      {/* Section C — Pricing Teaser */}
      <Row className="py-16 bg-slate-50 dark:bg-slate-800/30 rounded-lg text-center mt-8">
        <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-muted-foreground mb-6">
          Three tiers. Cancel anytime.
        </p>
        <Button asChild size="lg" className="bg-violet-600 hover:bg-violet-700 text-white border border-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 dark:border-violet-400 px-8">
          <Link href="/pricing">View Plans</Link>
        </Button>
      </Row>
    </Page>
  );
};

export default HomePageContent;
