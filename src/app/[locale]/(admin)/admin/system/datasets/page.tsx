import type { Metadata } from "next";
import SystemDatasetsClient from "@/components/admin/datasets/views/SystemDatasetsClient";

export const metadata: Metadata = {
  title: "Conjuntos de dados do sistema - Admin - dados.gov.pt",
  description: "Gestão de conjuntos de dados do sistema no portal dados.gov.pt.",
};

export default function SystemDatasetsPage() {
  return <SystemDatasetsClient />;
}
