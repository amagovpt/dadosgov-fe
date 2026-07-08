import { format } from "date-fns";
import { enGB, pt } from "date-fns/locale";
import type { Locale } from "date-fns";
import type { Post } from "@/service/types/posts";

export const ARTICLES_PAGE_SIZE = 12;

export type ArticlesSort = "recentes" | "antigos" | "visualizados";

export const ARTICLES_SORT_API: Record<ArticlesSort, string> = {
  recentes: "-published",
  antigos: "published",
  visualizados: "-last_modified",
};

export const ARTICLES_SORT_LABEL_KEYS: Record<ArticlesSort, string> = {
  recentes: "sortMostRecent",
  antigos: "sortOldest",
  visualizados: "sortMostViewed",
};

export function parseArticlesSort(value?: string): ArticlesSort {
  return value === "antigos" || value === "visualizados" ? value : "recentes";
}

const POST_DATE_FORMATS: Record<string, { pattern: string; dateFnsLocale: Locale }> = {
  pt: { pattern: "dd 'de' MMMM 'de' yyyy", dateFnsLocale: pt },
  en: { pattern: "d MMMM yyyy", dateFnsLocale: enGB },
};

export function formatPostDate(post: Post, locale: string = "pt"): string {
  const dateStr = post.published || post.created_at;
  if (!dateStr) return "";
  const { pattern, dateFnsLocale } = POST_DATE_FORMATS[locale] ?? POST_DATE_FORMATS.pt;
  try {
    return format(new Date(dateStr), pattern, { locale: dateFnsLocale });
  } catch {
    return "";
  }
}
