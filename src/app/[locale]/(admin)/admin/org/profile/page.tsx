import type { Metadata } from "next";
import AdminOrgRedirect from "@/components/admin/AdminOrgRedirect";

export const metadata: Metadata = {
  title: "Perfil da organização - Admin - dados.gov.pt",
  description: "Gestão do perfil da organização no portal dados.gov.pt.",
};

export default function OrgProfileRedirect() {
  return <AdminOrgRedirect targetPath="/admin/org/{orgId}/profile" />;
}
