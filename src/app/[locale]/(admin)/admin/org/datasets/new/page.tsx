import type { Metadata } from "next";
import { Suspense } from "react";
import OrgDatasetsNewClient from "@/components/admin/datasets/views/OrgDatasetsNewClient";
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

export default async function OrgDatasetsNewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoDatasets(locale);

  return (
    <Suspense>
      <OrgDatasetsNewClient pageContent={pageContent} />
    </Suspense>
  );
}
