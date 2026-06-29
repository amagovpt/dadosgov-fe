import type { Metadata } from "next";
import SystemOrganizationsClient from "@/components/admin/organizations/SystemOrganizationsClient";

export const metadata: Metadata = {
  title: "Organizações - Sistema - Admin - dados.gov.pt",
  description: "Gestão de organizações do sistema no portal dados.gov.pt.",
};

export default function SystemOrganizationsPage() {
  return <SystemOrganizationsClient />;
}
