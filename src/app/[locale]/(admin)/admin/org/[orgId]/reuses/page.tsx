import type { Metadata } from "next";
import OrgReusesClient from "@/components/admin/reuses/OrgReusesClient";

export const metadata: Metadata = {
  title: "Reutilizações - Organização - Admin - dados.gov.pt",
  description: "Gestão de reutilizações da organização no portal dados.gov.pt.",
};

export default function OrgReusesPage() {
  return <OrgReusesClient />;
}
