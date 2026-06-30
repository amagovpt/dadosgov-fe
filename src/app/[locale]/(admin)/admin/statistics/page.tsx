import type { Metadata } from "next";
import StatisticsClient from "@/components/admin/statistics/StatisticsClient";

export const metadata: Metadata = {
  title: "Estatísticas - Admin - dados.gov.pt",
  description: "Estatísticas do utilizador no portal dados.gov.pt.",
};

export default function StatisticsPage() {
  return <StatisticsClient />;
}
