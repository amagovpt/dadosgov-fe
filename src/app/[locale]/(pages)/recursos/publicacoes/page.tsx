import { Metadata } from "next";
import { Hero } from "@/components/Shared/Hero";
import { getPublicationsPage } from "@/service/queries/resources/publications";
import { parseHtmlToParagraphs } from "@/utils/htmlToParagraphs";
import { getCmsBaseUrl } from "@/service/utils/cmsBaseUrl";
import { fetchPdfPageCount } from "@/lib/pdfPageCount";
import PublicationsClient from "@/components/resources/PublicationsClient";
import {
  PUBLICATIONS_PAGE_SIZE,
  parsePublicationsSort,
  sortPublications,
} from "@/utils/publicationsListing";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const { hero } = await getPublicationsPage(locale);

  return {
    title: `${hero.title} - Dados Gov PT`,
    description: hero.description,
  };
}

export default async function PublicationsPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ page?: string; sort?: string }>;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { page: pageParam, sort: sortParam } = await searchParams;
  const sort = parsePublicationsSort(sortParam);
  const currentPage = Math.max(1, Number(pageParam) || 1);

  const { hero, publications } = await getPublicationsPage(locale);

  const getPagesNum = async (pdfDocument: string): Promise<number | null> => {
    if (pdfDocument === "#") return null;
    return fetchPdfPageCount(`${getCmsBaseUrl()}/api/assets/${pdfDocument}`);
  };

  const sorted = sortPublications(publications, sort);
  const total = sorted.length;
  const paged = sorted.slice(
    (currentPage - 1) * PUBLICATIONS_PAGE_SIZE,
    currentPage * PUBLICATIONS_PAGE_SIZE
  );

  const pageCounts = await Promise.all(
    paged.map((p) => (p.document?.[0] ? getPagesNum(p.document[0].slug) : null))
  );

  const pagedWithCounts = paged.map((p, i) => ({ ...p, pageCount: pageCounts[i] }));

  return (
    <main className="flex w-full flex-col items-center justify-center bg-primary-50">
      <Hero.Root backgroundImageUrl="/Banner/hero-bg.png">
        <Hero.Breadcrumb />
        <Hero.Content>
          <Hero.Title>{hero.title}</Hero.Title>
          <Hero.Description description={parseHtmlToParagraphs(hero.description)} />
        </Hero.Content>
      </Hero.Root>
      <PublicationsClient
        publications={pagedWithCounts}
        total={total}
        currentPage={currentPage}
        currentSort={sort}
      />
    </main>
  );
}
