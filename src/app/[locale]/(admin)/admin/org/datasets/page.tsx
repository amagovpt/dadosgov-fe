import type { Metadata } from "next";
import AdminOrgRedirect from "@/components/admin/AdminOrgRedirect";

export const metadata: Metadata = {
  title: "Conjuntos de dados da organização - Admin - dados.gov.pt",
  description: "Gestão de conjuntos de dados da organização no portal dados.gov.pt.",
};

export default function OrgDatasetsRedirect() {
  return <AdminOrgRedirect targetPath="/admin/org/{orgId}/datasets" />;
}
