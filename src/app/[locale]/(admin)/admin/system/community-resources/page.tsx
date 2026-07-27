import type { Metadata } from "next";
import { getBoCommunityResources, getBoCommunityResourcesMetadata } from "@/service/queries/admin/community-resources";
import SystemCommunityResourcesClient from "@/components/admin/community-resources/views/SystemCommunityResourcesClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoCommunityResourcesMetadata(locale, "systemMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function SystemCommunityResourcesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoCommunityResources(locale);

  return <SystemCommunityResourcesClient pageContent={pageContent} />;
}
