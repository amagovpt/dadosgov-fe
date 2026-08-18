import { Metadata } from "next";
import { Hero } from "@/components/Shared/Hero";
import { Pagination } from "@/components/Pagination";
import ResultsCount from "@/components/admin/ResultsCount";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { ArticlesSearchBar } from "@/components/articles/ArticlesSearchBar";
import { ArticlesSortSelect } from "@/components/articles/ArticlesSortSelect";
import { fetchPosts } from "@/service/api/posts";
import initTranslations from "@/app/i18n";
import {
  ARTICLES_PAGE_SIZE,
  ARTICLES_SORT_API,
  formatPostDate,
  parseArticlesSort,
} from "@/utils/articlesListing";
import { getNewsPage } from "@/service/queries/news";
import { parseHtmlToParagraphs } from "@/utils/htmlToParagraphs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  try {
    const { hero } = await getNewsPage(locale);
    return {
      title: `${hero.title} - dados.gov.pt`,
      description: hero.subtitle,
    };
  } catch (error) {
    // Fall back to the layout's default title rather than failing the whole
    // page render when the CMS is unreachable.
    console.error("Error fetching noticias metadata:", error);
    return {};
  }
}

export default async function ArticleListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; sort?: string; q?: string }>;
}) {
  const { locale } = await params;
  const { t } = await initTranslations({ locale, namespaces: ["common"] });
  const { hero, searchBar } = await getNewsPage(locale);
  const { page: pageParam, sort: sortParam, q } = await searchParams;
  const currentPage = Math.max(1, Number(pageParam) || 1);
  const sort = parseArticlesSort(sortParam);
  const query = q?.trim() || undefined;

  const { data: posts, total } = await fetchPosts(
    currentPage,
    ARTICLES_PAGE_SIZE,
    ARTICLES_SORT_API[sort],
    query
  );

  return (
    <main className="flex w-full flex-col items-center justify-center bg-primary-50">
      <Hero.Root backgroundImageUrl="/Banner/hero-bg.png">
        <Hero.Breadcrumb />
        <Hero.Content>
          <Hero.Title>{hero.title}</Hero.Title>
        </Hero.Content>
        <Hero.Actions>
          <ArticlesSearchBar
            initialQuery={query ?? ""}
            label={searchBar.label}
            placeholder={searchBar.placeholder}
            searchActionAltText={searchBar.searchActionAltText}
            voiceActionAltText={searchBar.voiceActionAltText}
          />
          <div className="mt-8 text-s-regular text-neutral-200">
            {parseHtmlToParagraphs(hero.description)}
          </div>
        </Hero.Actions>
      </Hero.Root>
      <div className="container flex flex-col items-center justify-center gap-32 py-32">
        <div className="flex w-full flex-col items-center justify-end">
          <div className="flex w-full items-end gap-16">
            <ResultsCount
              count={total}
              isLoading={false}
              className="w-full text-base font-medium text-neutral-900"
            />
            <div className="flex w-full items-end justify-end gap-16">
              <div className="max-w-256">
                <ArticlesSortSelect currentSort={sort} />
              </div>
            </div>
          </div>

          <div className="divider-neutral-200 mb-24 mt-12" />
          {posts.length === 0 ? (
            <div className="flex justify-center py-64">
              <span className="text-neutral-600">{t("404Articles")}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-32 lg:grid-cols-2">
              {posts.map((post) => (
                <ArticleCard key={post.id} post={post} formattedDate={formatPostDate(post, locale)} />
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalItems={total}
            pageSize={ARTICLES_PAGE_SIZE}
          />
        </div>
      </div>
    </main>
  );
}
