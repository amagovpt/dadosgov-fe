import type { Metadata } from "next";
import HarvestersNewClient from "@/components/admin/harvesters/views/HarvestersNewClient";
import { getBoHarvesters, getBoHarvestersMetadata } from "@/service/queries/admin/harvesters";
import { stripHtmlTags } from "@/utils/htmlToParagraphs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoHarvestersMetadata(locale);

  return {
    title: metadata.title,
    description: stripHtmlTags(metadata.description),
  };
}

export default async function HarvestersNewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoHarvesters(locale);

  return <HarvestersNewClient pageContent={pageContent} />;
}
