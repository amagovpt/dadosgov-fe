import type { Metadata } from "next";
import AdminOrgRedirect from "@/components/admin/AdminOrgRedirect";

export const metadata: Metadata = {
  title: "Nova reutilização da organização - Admin - dados.gov.pt",
  description: "Criação de reutilizações da organização no portal dados.gov.pt.",
};

export default function OrgReusesNewRedirect() {
  return <AdminOrgRedirect targetPath="/admin/org/{orgId}/reuses/new" preserveSearchParams />;
}
