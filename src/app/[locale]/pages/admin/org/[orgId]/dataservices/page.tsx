import type { Metadata } from "next";
import OrgDataservicesClient from "@/components/admin/dataservices/OrgDataservicesClient";

export const metadata: Metadata = {
  title: "API - Organização - Admin - dados.gov.pt",
  description: "Gestão de APIs da organização no portal dados.gov.pt.",
};

export default function OrgDataservicesPage() {
  return <OrgDataservicesClient />;
}
