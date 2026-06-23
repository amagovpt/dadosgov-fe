import type { Metadata } from "next";
import OrgHarvestersClient from "@/components/admin/harvesters/views/OrgHarvestersClient";

export const metadata: Metadata = {
  title: "Harvesters - OrganizaÃƒÂ§ÃƒÂ£o - Admin - dados.gov.pt",
  description: "GestÃƒÂ£o de harvesters da organizaÃƒÂ§ÃƒÂ£o no portal dados.gov.pt.",
};

export default function OrgHarvestersPage() {
  return <OrgHarvestersClient />;
}
