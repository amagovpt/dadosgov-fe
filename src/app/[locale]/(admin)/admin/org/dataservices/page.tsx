import type { Metadata } from "next";
import AdminOrgRedirect from "@/components/admin/AdminOrgRedirect";

export const metadata: Metadata = {
  title: "APIs da organização - Admin - dados.gov.pt",
  description: "Gestão de APIs da organização no portal dados.gov.pt.",
};

export default function OrgDataservicesRedirect() {
  return <AdminOrgRedirect targetPath="/admin/org/{orgId}/dataservices" />;
}
