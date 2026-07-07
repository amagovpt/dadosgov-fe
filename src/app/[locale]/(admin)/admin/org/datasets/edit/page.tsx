import type { Metadata } from "next";
import AdminOrgRedirect from "@/components/admin/AdminOrgRedirect";

export const metadata: Metadata = {
  title: "Editar conjunto de dados da organização - Admin - dados.gov.pt",
  description: "Edição de conjuntos de dados da organização no portal dados.gov.pt.",
};

export default function OrgDatasetsEditRedirect() {
  return (
    <AdminOrgRedirect targetPath="/admin/org/{orgId}/datasets/edit" preserveSearchParams />
  );
}
