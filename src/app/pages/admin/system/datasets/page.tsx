import type { Metadata } from "next";
import SystemDatasetsClient from "@/components/admin/datasets/views/SystemDatasetsClient";

export const metadata: Metadata = {
  title: "Conjunto de dados - Sistema - Admin - dados.gov.pt",
  description: "GestÃƒÂ£o de conjuntos de dados do sistema no portal dados.gov.pt.",
};

export default function SystemDatasetsPage() {
  return <SystemDatasetsClient />;
}
