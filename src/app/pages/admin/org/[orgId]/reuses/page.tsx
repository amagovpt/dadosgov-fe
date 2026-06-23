import type { Metadata } from "next";
import OrgReusesClient from "@/components/admin/reuses/views/OrgReusesClient";

export const metadata: Metadata = {
  title: "ReutilizaÃƒÂ§ÃƒÂµes - OrganizaÃƒÂ§ÃƒÂ£o - Admin - dados.gov.pt",
  description: "GestÃƒÂ£o de reutilizaÃƒÂ§ÃƒÂµes da organizaÃƒÂ§ÃƒÂ£o no portal dados.gov.pt.",
};

export default function OrgReusesPage() {
  return <OrgReusesClient />;
}
