import type { Metadata } from "next";
import { Suspense } from "react";
import HarvesterDetailClient from "@/components/admin/harvesters/views/HarvesterDetailClient";

export const metadata: Metadata = {
  title: "Detalhe do harvester - Admin - dados.gov.pt",
  description: "Detalhe de um harvester da organização no portal dados.gov.pt.",
};

export default async function OrgHarvesterDetailPage({
  params,
}: {
  params: Promise<{ orgId: string; slug: string }>;
}) {
  const { orgId, slug } = await params;
  return (
    <Suspense>
      <HarvesterDetailClient slug={slug} orgId={orgId} />
    </Suspense>
  );
}
