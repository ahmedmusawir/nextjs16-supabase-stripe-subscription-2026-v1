import ArticleDetailContent from "./ArticleDetailContent";

interface Props {
  params: Promise<{ slug: string }>;
}

const ArticleDetailPage = async ({ params }: Props) => {
  const { slug } = await params;
  return <ArticleDetailContent slug={slug} />;
};

export default ArticleDetailPage;
