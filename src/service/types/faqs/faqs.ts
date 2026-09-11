import { Hero, Sitemap } from "../shared";

export interface FaqsContent {
  id: string;
  title: string;
  body: string;
  actionTitle: string;
  actions: Array<{
    children: string;
    href: string;
  }>;
  hero: Hero;
  sitemap: Sitemap;
  paragraph: Array<{
    id: string;
    title: string;
    description: string;
  }>;
}
