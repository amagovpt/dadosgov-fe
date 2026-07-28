import type { Metadata } from "next";
import DatasetsNewClient from "@/components/admin/datasets/views/DatasetsNewClient";
import { getBoDatasets, getBoDatasetsMetadata } from "@/service/queries/admin/datasets";
import { stripHtmlTags } from "@/utils/htmlToParagraphs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoDatasetsMetadata(locale);

  return {
    title: metadata.title,
    description: stripHtmlTags(metadata.description),
  };
}

export default async function DatasetsNewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoDatasets(locale);

  return <DatasetsNewClient pageContent={pageContent} />;
}
