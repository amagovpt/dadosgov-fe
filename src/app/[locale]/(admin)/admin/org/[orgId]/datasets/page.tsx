import type { Metadata } from "next";
import { getBoDatasets, getBoDatasetsMetadata } from "@/service/queries/admin/datasets";
import DatasetsClient from "@/components/admin/datasets/views/DatasetsClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoDatasetsMetadata(locale, "orgListMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function OrgDatasetsPage({
  params,
}: {
  params: Promise<{ locale: string; orgId: string }>;
}) {
  const { locale, orgId } = await params;
  const pageContent = await getBoDatasets(locale);

  return (
    <DatasetsClient
      key={`organization:${orgId}`}
      scope="organization"
      orgId={orgId}
      pageContent={pageContent}
    />
  );
}
