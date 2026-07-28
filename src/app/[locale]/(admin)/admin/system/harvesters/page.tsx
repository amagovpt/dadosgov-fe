import type { Metadata } from "next";
import { getBoHarvesters, getBoHarvestersMetadata } from "@/service/queries/admin/harvesters";
import SystemHarvestersClient from "@/components/admin/harvesters/views/SystemHarvestersClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoHarvestersMetadata(locale, "systemMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function SystemHarvestersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoHarvesters(locale);

  return <SystemHarvestersClient pageContent={pageContent} />;
}
