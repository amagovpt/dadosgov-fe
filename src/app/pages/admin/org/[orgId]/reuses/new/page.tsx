import type { Metadata } from "next";
import OrgReusesNewClient from "@/components/admin/reuses/views/OrgReusesNewClient";

export const metadata: Metadata = {
  title: "Nova reutilizaÃƒÂ§ÃƒÂ£o - OrganizaÃƒÂ§ÃƒÂ£o - Admin - dados.gov.pt",
  description: "Publique uma nova reutilizaÃƒÂ§ÃƒÂ£o da organizaÃƒÂ§ÃƒÂ£o no portal dados.gov.pt.",
};

export default function OrgReusesNewPage() {
  return <OrgReusesNewClient />;
}
