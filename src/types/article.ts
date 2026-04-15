import type { SubscriptionTier } from './subscription';

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  required_tier: SubscriptionTier;
  content_preview: string;
  content_full: string;
  published_at: string;
  author: string;
}
