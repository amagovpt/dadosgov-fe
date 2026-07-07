import type { Metadata } from "next";
import AdminOrgRedirect from "@/components/admin/AdminOrgRedirect";

export const metadata: Metadata = {
  title: "Estatísticas da organização - Admin - dados.gov.pt",
  description: "Consulta de estatísticas da organização no portal dados.gov.pt.",
};

export default function OrgStatisticsRedirect() {
  return <AdminOrgRedirect targetPath="/admin/org/{orgId}/statistics" />;
}
