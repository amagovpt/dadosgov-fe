import type { Metadata } from "next";
import SystemReusesClient from "@/components/admin/reuses/views/SystemReusesClient";

export const metadata: Metadata = {
  title: "ReutilizaÃƒÂ§ÃƒÂµes - Sistema - Admin - dados.gov.pt",
  description: "GestÃƒÂ£o de reutilizaÃƒÂ§ÃƒÂµes do sistema no portal dados.gov.pt.",
};

export default function SystemReusesPage() {
  return <SystemReusesClient />;
}
