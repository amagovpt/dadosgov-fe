import type { Metadata } from "next";
import { getBoCommunityResources, getBoCommunityResourcesMetadata } from "@/service/queries/admin/community-resources";
import CommunityResourcesClient from "@/components/admin/community-resources/views/CommunityResourcesClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoCommunityResourcesMetadata(locale, "myListMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function CommunityResourcesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoCommunityResources(locale);

  return <CommunityResourcesClient pageContent={pageContent} />;
}
