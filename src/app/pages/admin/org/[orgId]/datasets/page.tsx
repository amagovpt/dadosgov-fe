import type { Metadata } from "next";
import OrgDatasetsClient from "@/components/admin/datasets/views/OrgDatasetsClient";

export const metadata: Metadata = {
  title: "Conjunto de dados - OrganizaÃƒÂ§ÃƒÂ£o - Admin - dados.gov.pt",
  description: "GestÃƒÂ£o de conjuntos de dados da organizaÃƒÂ§ÃƒÂ£o no portal dados.gov.pt.",
};

export default async function OrgDatasetsPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  return <OrgDatasetsClient orgId={orgId} />;
}
