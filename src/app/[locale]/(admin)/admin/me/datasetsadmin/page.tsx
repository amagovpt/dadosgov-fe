import type { Metadata } from "next";
import DatasetsAdminClient from "@/components/admin/datasets/publication-wizard/DatasetsAdminClient";
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

export default async function DatasetsAdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoDatasets(locale);

  return <DatasetsAdminClient pageContent={pageContent} />;
}
