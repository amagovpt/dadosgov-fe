import type { Metadata } from "next";
import OrgDataservicesClient from "@/components/admin/dataservices/views/OrgDataservicesClient";

export const metadata: Metadata = {
  title: "API - OrganizaÃƒÂ§ÃƒÂ£o - Admin - dados.gov.pt",
  description: "GestÃƒÂ£o de APIs da organizaÃƒÂ§ÃƒÂ£o no portal dados.gov.pt.",
};

export default function OrgDataservicesPage() {
  return <OrgDataservicesClient />;
}
