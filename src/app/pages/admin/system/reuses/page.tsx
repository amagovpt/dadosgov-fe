import type { Metadata } from "next";
import SystemReusesClient from "@/components/admin/reuses/views/SystemReusesClient";

export const metadata: Metadata = {
  title: "Reutilizações - Sistema - Admin - dados.gov.pt",
  description: "Gestão de reutilizações do sistema no portal dados.gov.pt.",
};

export default function SystemReusesPage() {
  return <SystemReusesClient />;
}
