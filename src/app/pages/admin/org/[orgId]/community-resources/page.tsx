import type { Metadata } from "next";
import OrgCommunityResourcesClient from "@/components/admin/community-resources/views/OrgCommunityResourcesClient";

export const metadata: Metadata = {
  title: "Recursos comunitÃƒÂ¡rios - OrganizaÃƒÂ§ÃƒÂ£o - Admin - dados.gov.pt",
  description: "GestÃƒÂ£o de recursos comunitÃƒÂ¡rios da organizaÃƒÂ§ÃƒÂ£o no portal dados.gov.pt.",
};

export default function OrgCommunityResourcesPage() {
  return <OrgCommunityResourcesClient />;
}
