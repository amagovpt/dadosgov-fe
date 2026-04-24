import type { Metadata } from "next";
import SystemCommunityResourcesClient from "@/components/admin/community-resources/SystemCommunityResourcesClient";

export const metadata: Metadata = {
  title: "Recursos comunitários - Sistema - Admin - dados.gov.pt",
  description: "Gestão de recursos comunitários do sistema no portal dados.gov.pt.",
};

export default function SystemCommunityResourcesPage() {
  return <SystemCommunityResourcesClient />;
}
