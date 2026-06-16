import type { Dataset } from '@/service/types/dataset';
import type { Reuse } from '@/service/types/reuse';
import type { Post } from '@/service/types/posts';
import type { SiteMetrics } from '@/service/types/shared';

export interface HomepageData {
  site_metrics: SiteMetrics;
  latest_datasets: Dataset[];
  latest_reuses: Reuse[];
  latest_posts: Post[];
}

export interface HomeContent {
  featured_datasets: Dataset[];
  featured_reuses: Reuse[];
}
