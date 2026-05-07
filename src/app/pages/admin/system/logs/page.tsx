import type { Metadata } from "next";
import SystemLogsClient from "@/components/admin/logs/SystemLogsClient";

export const metadata: Metadata = {
  title: "Logs - Sistema - Admin - dados.gov.pt",
  description: "Visualização de logs do servidor no portal dados.gov.pt.",
};

export default function SystemLogsPage() {
  return <SystemLogsClient />;
}
