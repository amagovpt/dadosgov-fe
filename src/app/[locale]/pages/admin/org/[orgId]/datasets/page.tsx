import type { Metadata } from "next";
import OrgDatasetsClient from "@/components/admin/datasets/OrgDatasetsClient";

export const metadata: Metadata = {
  title: "Conjunto de dados - Organização - Admin - dados.gov.pt",
  description: "Gestão de conjuntos de dados da organização no portal dados.gov.pt.",
};

export default async function OrgDatasetsPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  return <OrgDatasetsClient orgId={orgId} />;
}
