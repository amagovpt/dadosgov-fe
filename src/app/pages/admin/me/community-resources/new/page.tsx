import type { Metadata } from "next";
import CommunityResourceNewClient from "@/components/admin/community-resources/views/CommunityResourceNewClient";

export const metadata: Metadata = {
  title: "Novo recurso comunitÃƒÂ¡rio - Admin - dados.gov.pt",
  description:
    "FormulÃƒÂ¡rio para publicar um novo recurso comunitÃƒÂ¡rio no portal dados.gov.pt.",
};

export default function CommunityResourceNewPage() {
  return <CommunityResourceNewClient />;
}
