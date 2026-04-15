import type { Article } from '@/types/article';
import { mockArticles } from '@/mocks/data/articles';

export const articleService = {
  getAll: async (): Promise<Article[]> => {
    return [...mockArticles].sort(
      (a, b) =>
        new Date(b.published_at).getTime() -
        new Date(a.published_at).getTime()
    );
  },

  getBySlug: async (slug: string): Promise<Article | null> => {
    return mockArticles.find((a) => a.slug === slug) ?? null;
  },

  getRecent: async (limit: number = 3): Promise<Article[]> => {
    return [...mockArticles]
      .sort(
        (a, b) =>
          new Date(b.published_at).getTime() -
          new Date(a.published_at).getTime()
      )
      .slice(0, limit);
  },
};
