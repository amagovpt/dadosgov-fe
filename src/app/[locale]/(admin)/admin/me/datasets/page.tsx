import type { Metadata } from "next";
import { getBoDatasets, getBoDatasetsMetadata } from "@/service/queries/admin/datasets";
import { Suspense } from "react";
import DatasetsClient from "@/components/admin/datasets/views/DatasetsClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoDatasetsMetadata(locale, "myListMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function DatasetsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoDatasets(locale);

  return (
    <Suspense>
      <DatasetsClient pageContent={pageContent} />
    </Suspense>
  );
}
