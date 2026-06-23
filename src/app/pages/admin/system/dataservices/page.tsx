import type { Metadata } from "next";
import SystemDataservicesClient from "@/components/admin/dataservices/views/SystemDataservicesClient";

export const metadata: Metadata = {
  title: "API - Sistema - Admin - dados.gov.pt",
  description: "GestÃƒÂ£o de APIs do sistema no portal dados.gov.pt.",
};

export default function SystemDataservicesPage() {
  return <SystemDataservicesClient />;
}
