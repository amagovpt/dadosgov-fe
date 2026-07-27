import type { Metadata } from "next";
import CommunityResourceNewClient from "@/components/admin/community-resources/views/CommunityResourceNewClient";
import {
  getBoCommunityResources,
  getBoCommunityResourcesMetadata,
} from "@/service/queries/admin/community-resources";
import { stripHtmlTags } from "@/utils/htmlToParagraphs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoCommunityResourcesMetadata(locale);

  return {
    title: metadata.title,
    description: stripHtmlTags(metadata.description),
  };
}

export default async function CommunityResourcesNewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoCommunityResources(locale);

  return <CommunityResourceNewClient pageContent={pageContent} />;
}
