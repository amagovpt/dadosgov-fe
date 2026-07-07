import type { Metadata } from "next";
import AdminOrgRedirect from "@/components/admin/AdminOrgRedirect";

export const metadata: Metadata = {
  title: "Editar reutilização da organização - Admin - dados.gov.pt",
  description: "Edição de reutilizações da organização no portal dados.gov.pt.",
};

export default function OrgReusesEditRedirect() {
  return <AdminOrgRedirect targetPath="/admin/org/{orgId}/reuses/edit" preserveSearchParams />;
}
