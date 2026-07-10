import { Metadata } from "next";
import { headers } from "next/headers";
import HeroGeneral from "@/components/HeroGeneral";
import { getPublicationsPage } from "@/service/queries/resources/publications";
import { parseHtmlToParagraphs } from "@/utils/htmlToParagraphs";
import { getAssets } from "@/utils/getAssets";
import { getDocumentProxy } from "unpdf";
import PublicationsClient from "@/components/resources/PublicationsClient";
import {
  PUBLICATIONS_PAGE_SIZE,
  parsePublicationsSort,
  sortPublications,
} from "@/utils/publicationsListing";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { hero } = await getPublicationsPage("pt");

  return {
    title: `${hero.title} - Dados Gov PT`,
    description: hero.description,
  };
}

export default async function PublicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string }>;
}) {
  const { page: pageParam, sort: sortParam } = await searchParams;
  const sort = parsePublicationsSort(sortParam);
  const currentPage = Math.max(1, Number(pageParam) || 1);

  const { hero, publications } = await getPublicationsPage("pt");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  const getPagesNum = async (pdfDocument: string): Promise<number | null> => {
    if (pdfDocument === "#") return null;

    const url = `${origin}${getAssets(pdfDocument)}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`[publications] page count fetch ${url} returned ${res.status}`);
        return null;
      }

      const bytes = await res.arrayBuffer();
      const pdf = await getDocumentProxy(new Uint8Array(bytes));
      return pdf.numPages;
    } catch (error) {
      console.error(`[publications] page count fetch ${url} failed:`, error);
      return null;
    }
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
      <HeroGeneral
        title={hero.title}
        backgroundImageUrl="/Banner/hero-bg.png"
        breadcrumbItems={[
          { label: "Início", url: "/" },
          { label: "Recursos", url: "/recursos" },
          { label: "Publicações", url: "/publicacoes" },
        ]}
      >
        <div className="text-white">{parseHtmlToParagraphs(hero.description)}</div>
      </HeroGeneral>
      <PublicationsClient
        publications={pagedWithCounts}
        total={total}
        currentPage={currentPage}
        currentSort={sort}
      />
    </main>
  );
}
