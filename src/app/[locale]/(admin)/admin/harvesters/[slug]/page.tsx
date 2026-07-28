import type { Metadata } from "next";
import { getBoHarvesters, getBoHarvestersMetadata } from "@/service/queries/admin/harvesters";
import HarvesterDetailClient from "@/components/admin/harvesters/views/HarvesterDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoHarvestersMetadata(locale, "detailMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function HarvesterDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const pageContent = await getBoHarvesters(locale);
  return <HarvesterDetailClient slug={slug} pageContent={pageContent} />;
}
