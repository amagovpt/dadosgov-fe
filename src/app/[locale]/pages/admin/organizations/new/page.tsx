import type { Metadata } from "next";
import OrganizationsNewClient from "@/components/admin/organizations/OrganizationsNewClient";

export const metadata: Metadata = {
  title: "Criar organização - Admin - dados.gov.pt",
  description: "Criação de uma nova organização no portal dados.gov.pt.",
};

export default function OrganizationsNewPage() {
  return <OrganizationsNewClient />;
}
