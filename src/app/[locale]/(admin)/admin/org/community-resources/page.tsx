import type { Metadata } from "next";
import AdminOrgRedirect from "@/components/admin/AdminOrgRedirect";

export const metadata: Metadata = {
  title: "Recursos da comunidade da organização - Admin - dados.gov.pt",
  description: "Gestão de recursos da comunidade da organização no portal dados.gov.pt.",
};

export default function OrgCommunityResourcesRedirect() {
  return <AdminOrgRedirect targetPath="/admin/org/{orgId}/community-resources" />;
}
