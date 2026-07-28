import type { Metadata } from "next";
import { getBoHarvesters, getBoHarvestersMetadata } from "@/service/queries/admin/harvesters";
import OrgHarvestersClient from "@/components/admin/harvesters/views/OrgHarvestersClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoHarvestersMetadata(locale, "orgMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function OrgHarvestersPage({
  params,
}: {
  params: Promise<{ locale: string; orgId: string }>;
}) {
  const { locale, orgId } = await params;
  const pageContent = await getBoHarvesters(locale);

  return <OrgHarvestersClient orgId={orgId} pageContent={pageContent} />;
}
