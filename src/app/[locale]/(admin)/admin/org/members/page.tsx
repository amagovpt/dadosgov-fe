import type { Metadata } from "next";
import AdminOrgRedirect from "@/components/admin/AdminOrgRedirect";

export const metadata: Metadata = {
  title: "Membros da organização - Admin - dados.gov.pt",
  description: "Gestão de membros da organização no portal dados.gov.pt.",
};

export default function OrgMembersRedirect() {
  return <AdminOrgRedirect targetPath="/admin/org/{orgId}/members" />;
}
