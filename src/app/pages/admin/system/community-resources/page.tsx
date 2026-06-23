import type { Metadata } from "next";
import SystemCommunityResourcesClient from "@/components/admin/community-resources/views/SystemCommunityResourcesClient";

export const metadata: Metadata = {
  title: "Recursos comunitÃƒÂ¡rios - Sistema - Admin - dados.gov.pt",
  description: "GestÃƒÂ£o de recursos comunitÃƒÂ¡rios do sistema no portal dados.gov.pt.",
};

export default function SystemCommunityResourcesPage() {
  return <SystemCommunityResourcesClient />;
}
