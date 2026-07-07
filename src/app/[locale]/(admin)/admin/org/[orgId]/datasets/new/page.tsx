import type { Metadata } from "next";
import AdminOrgRedirect from "@/components/admin/AdminOrgRedirect";

export const metadata: Metadata = {
  title: "Novo conjunto de dados da organização - Admin - dados.gov.pt",
  description: "Criação de conjuntos de dados da organização no portal dados.gov.pt.",
};

export default function OrgDatasetsNewRedirect() {
  return (
    <AdminOrgRedirect
      targetPath="/admin/org/datasets/new"
      preserveSearchParams
      requireActiveOrganization={false}
    />
  );
}
