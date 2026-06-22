import type { Metadata } from "next";
import CommunityResourceNewClient from "@/components/admin/community-resources/CommunityResourceNewClient";

export const metadata: Metadata = {
  title: "Novo recurso comunitário - Admin - dados.gov.pt",
  description:
    "Formulário para publicar um novo recurso comunitário no portal dados.gov.pt.",
};

export default function CommunityResourceNewPage() {
  return <CommunityResourceNewClient />;
}
