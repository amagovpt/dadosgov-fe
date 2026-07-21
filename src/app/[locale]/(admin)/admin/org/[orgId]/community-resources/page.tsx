import type { Metadata } from "next";
import { getBoCommunityResources, getBoCommunityResourcesMetadata } from "@/service/queries/admin/community-resources";
import OrgCommunityResourcesClient from "@/components/admin/community-resources/views/OrgCommunityResourcesClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoCommunityResourcesMetadata(locale, "orgMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function OrgCommunityResourcesPage({
  params,
}: {
  params: Promise<{ locale: string; orgId: string }>;
}) {
  const { locale, orgId } = await params;
  const pageContent = await getBoCommunityResources(locale);

  return <OrgCommunityResourcesClient orgId={orgId} pageContent={pageContent} />;
}
