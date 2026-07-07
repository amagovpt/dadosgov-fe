import type { Metadata } from "next";
import AdminOrgRedirect from "@/components/admin/AdminOrgRedirect";

export const metadata: Metadata = {
  title: "Reutilizações da organização - Admin - dados.gov.pt",
  description: "Gestão de reutilizações da organização no portal dados.gov.pt.",
};

export default function OrgReusesRedirect() {
  return <AdminOrgRedirect targetPath="/admin/org/{orgId}/reuses" />;
}
