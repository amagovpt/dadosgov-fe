import type { Metadata } from "next";
import CommunityResourcesClient from "@/components/admin/community-resources/views/CommunityResourcesClient";

export const metadata: Metadata = {
  title: "Recursos comunitÃƒÂ¡rios - Admin - dados.gov.pt",
  description: "GestÃƒÂ£o de recursos comunitÃƒÂ¡rios no portal dados.gov.pt.",
};

export default function CommunityResourcesPage() {
  return <CommunityResourcesClient />;
}
