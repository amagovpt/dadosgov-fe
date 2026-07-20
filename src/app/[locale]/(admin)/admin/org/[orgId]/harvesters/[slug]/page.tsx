import type { Metadata } from "next";
import { Suspense } from "react";
import HarvesterDetailClient from "@/components/admin/harvesters/views/HarvesterDetailClient";
import { getBoHarvesters } from "@/service/queries/admin/harvesters";

export const metadata: Metadata = {
  title: "Detalhe do harvester - Admin - dados.gov.pt",
  description: "Detalhe de um harvester da organização no portal dados.gov.pt.",
};

export default async function OrgHarvesterDetailPage({
  params,
}: {
  params: Promise<{ locale: string; orgId: string; slug: string }>;
}) {
  const { locale, orgId, slug } = await params;
  const pageContent = await getBoHarvesters(locale);
  return (
    <Suspense>
      <HarvesterDetailClient slug={slug} orgId={orgId} pageContent={pageContent} />
    </Suspense>
  );
}
