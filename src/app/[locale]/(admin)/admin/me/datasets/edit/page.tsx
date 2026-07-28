import type { Metadata } from "next";
import { getBoDatasets, getBoDatasetsMetadata } from "@/service/queries/admin/datasets";
import DatasetsEditClient from "@/components/admin/datasets/views/DatasetsEditClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoDatasetsMetadata(locale, "myEditMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function DatasetsEditPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoDatasets(locale);

  return <DatasetsEditClient pageContent={pageContent} />;
}
