import type { Metadata } from "next";
import OrgHarvestersClient from "@/components/admin/harvesters/OrgHarvestersClient";

export const metadata: Metadata = {
  title: "Harvesters - Organização - Admin - dados.gov.pt",
  description: "Gestão de harvesters da organização no portal dados.gov.pt.",
};

export default function OrgHarvestersPage() {
  return <OrgHarvestersClient />;
}
