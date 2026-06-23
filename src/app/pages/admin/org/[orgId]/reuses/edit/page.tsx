import type { Metadata } from "next";
import ReusesEditClient from "@/components/admin/reuses/views/ReusesEditClient";

export const metadata: Metadata = {
  title: "Editar reutilizaÃƒÂ§ÃƒÂ£o - OrganizaÃƒÂ§ÃƒÂ£o - Admin - dados.gov.pt",
  description: "Editar reutilizaÃƒÂ§ÃƒÂ£o da organizaÃƒÂ§ÃƒÂ£o no portal dados.gov.pt.",
};

export default function OrgReusesEditPage() {
  return <ReusesEditClient />;
}
