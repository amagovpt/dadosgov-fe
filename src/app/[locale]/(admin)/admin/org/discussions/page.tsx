import type { Metadata } from "next";
import AdminOrgRedirect from "@/components/admin/AdminOrgRedirect";

export const metadata: Metadata = {
  title: "Discussões da organização - Admin - dados.gov.pt",
  description: "Gestão de discussões da organização no portal dados.gov.pt.",
};

export default function OrgDiscussionsRedirect() {
  return <AdminOrgRedirect targetPath="/admin/org/{orgId}/discussions" />;
}
