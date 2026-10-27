import type { Metadata } from "next";
import { Suspense } from "react";
import DatasetsNewClient from "@/components/admin/datasets/views/DatasetsNewClient";
import { getBoDatasets, getBoDatasetsMetadata } from "@/service/queries/admin/datasets";
import { stripHtmlTags } from "@/utils/htmlToParagraphs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; orgId: string }>;
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
  params: Promise<{ locale: string; orgId: string }>;
}) {
  const { locale, orgId } = await params;
  const pageContent = await getBoDatasets(locale);

  return (
    <Suspense>
      <DatasetsNewClient key={orgId} pageContent={pageContent} orgId={orgId} />
    </Suspense>
  );
}
