import type { Metadata } from "next";
import { getBoCommunityResources, getBoCommunityResourcesMetadata } from "@/service/queries/admin/community-resources";
import CommunityResourceEditClient from "@/components/admin/community-resources/views/CommunityResourceEditClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoCommunityResourcesMetadata(locale, "editMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function CommunityResourcesEditPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoCommunityResources(locale);

  return <CommunityResourceEditClient pageContent={pageContent} />;
}
