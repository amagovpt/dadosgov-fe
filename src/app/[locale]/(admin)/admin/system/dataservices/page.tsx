import type { Metadata } from "next";
import SystemDataservicesClient from "@/components/admin/dataservices/SystemDataservicesClient";

export const metadata: Metadata = {
  title: "API - Sistema - Admin - dados.gov.pt",
  description: "Gestão de APIs do sistema no portal dados.gov.pt.",
};

export default function SystemDataservicesPage() {
  return <SystemDataservicesClient />;
}
