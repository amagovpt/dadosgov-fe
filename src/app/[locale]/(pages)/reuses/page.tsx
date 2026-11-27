import { fetchReusesListing } from "@/service/api/reuses";
import ReusesClient from '@/components/reuses/ReusesClient';
import { parseReusesFilters } from "@/utils/reusesListingQuery";
import { serverForwardedHeaders } from "@/service/utils/serverForwardedHeaders";
import { Metadata } from 'next';
import { getFrontOfficeMetadata, getFrontOfficePage } from "@/service/queries/common";
import { stripHtmlTags } from "@/utils/htmlToParagraphs";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  try {
    const metadata = await getFrontOfficeMetadata("reuses",locale);
    return {
      title: metadata.title,
      description: stripHtmlTags(metadata.description),
    };
  } catch (error) {
    // Fall back to the layout's default title/description rather than failing
    // the whole page render when the CMS is unreachable.
    console.error("Error fetching reuses metadata:", error);
    return {};
  }
}


export default async function ReusesPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{
        page?: string;
        q?: string;
        type?: string;
        tag?: string | string[];
        organization?: string | string[];
        sort?: string;
        modified_since?: string;
    }>;
}) {
    const { locale } = await params;
    const resolvedSearchParams = await searchParams;
    const page = Number(resolvedSearchParams?.page) || 1;
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(resolvedSearchParams ?? {})) {
        if (value === undefined) continue;
        for (const item of Array.isArray(value) ? value : [value]) {
            queryParams.append(key, item);
        }
    }
    const apiFilters = parseReusesFilters(queryParams);

    // LEDG-1836: one aggregated call replaces the prior Promise.all of 6 fetches.
    // Relay the real client IP on the SSR fetch (which, on a listing-cache miss,
    // goes direct to the backend) so the limiter keys per visitor, not the Next IP.
    const forwarded = await serverForwardedHeaders();
    const data = await fetchReusesListing(page, 8, apiFilters, forwarded);

    const pageContent = await getFrontOfficePage("reuses", locale);

    return (
        <ReusesClient
            initialData={data.listing}
            currentPage={page}
            filterCounts={data.filter_counts}
            allOrganizations={data.organizations}
            pageContent={pageContent}
        />
    );
}
