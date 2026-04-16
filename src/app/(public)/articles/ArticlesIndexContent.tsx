import Page from "@/components/common/Page";
import Row from "@/components/common/Row";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { articleService } from "@/services/articleService";

const ArticlesIndexContent = async () => {
  const articles = await articleService.getAll();

  return (
    <Page className="" FULL={false}>
      <Row className="py-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">
          All Articles
        </h1>
        <p className="text-muted-foreground mb-8">
          Free + premium tech writing.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </Row>
    </Page>
  );
};

export default ArticlesIndexContent;
