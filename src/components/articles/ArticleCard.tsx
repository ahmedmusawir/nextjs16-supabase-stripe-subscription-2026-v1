import Link from 'next/link';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TierBadge } from '@/components/common/TierBadge';
import type { Article } from '@/types/article';

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const formattedDate = new Date(article.published_at).toLocaleDateString(
    'en-US',
    { year: 'numeric', month: 'short', day: 'numeric' }
  );

  return (
    <Link href={`/articles/${article.slug}`} className="group">
      <Card className="h-full transition-shadow hover:shadow-lg cursor-pointer bg-white dark:bg-slate-800 border dark:border-slate-700">
        <CardHeader className="pb-3">
          {article.required_tier !== 'free' && (
            <div className="mb-2">
              <TierBadge tier={article.required_tier} />
            </div>
          )}
          <CardTitle className="text-lg leading-tight line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
            {article.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {article.excerpt}
          </p>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            {article.author} · {formattedDate}
          </p>
        </CardFooter>
      </Card>
    </Link>
  );
}

export default ArticleCard;
