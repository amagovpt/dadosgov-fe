import type { Metadata } from "next";
import DatasetsClient from "@/components/admin/datasets/views/DatasetsClient";

export const metadata: Metadata = {
  title: "Conjunto de dados - Admin - dados.gov.pt",
  description: "GestÃƒÂ£o de conjuntos de dados no portal dados.gov.pt.",
};

export default function DatasetsPage() {
  return <DatasetsClient />;
}
