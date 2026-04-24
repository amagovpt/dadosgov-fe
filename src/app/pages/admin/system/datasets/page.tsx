import type { Metadata } from "next";
import SystemDatasetsClient from "@/components/admin/datasets/SystemDatasetsClient";

export const metadata: Metadata = {
  title: "Conjunto de dados - Sistema - Admin - dados.gov.pt",
  description: "Gestão de conjuntos de dados do sistema no portal dados.gov.pt.",
};

export default function SystemDatasetsPage() {
  return <SystemDatasetsClient />;
}
