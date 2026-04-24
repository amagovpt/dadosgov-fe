import type { Metadata } from "next";
import CommunityResourcesClient from "@/components/admin/community-resources/CommunityResourcesClient";

export const metadata: Metadata = {
  title: "Recursos comunitários - Admin - dados.gov.pt",
  description: "Gestão de recursos comunitários no portal dados.gov.pt.",
};

export default function CommunityResourcesPage() {
  return <CommunityResourcesClient />;
}
