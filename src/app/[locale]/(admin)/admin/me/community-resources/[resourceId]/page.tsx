import type { Metadata } from "next";
import CommunityResourceEditClient from "@/components/admin/community-resources/views/CommunityResourceEditClient";

export const metadata: Metadata = {
  title: "Editar recurso comunitário - Admin - dados.gov.pt",
  description: "Editar um recurso comunitário no portal dados.gov.pt.",
};

export default function CommunityResourceEditByIdPage() {
  return <CommunityResourceEditClient />;
}
