import type { Metadata } from "next";
import DatasetsEditClient from "@/components/admin/datasets/views/DatasetsEditClient";

export const metadata: Metadata = {
  title: "Editar conjunto de dados - Admin - dados.gov.pt",
  description: "Edição dos meus conjuntos de dados no portal dados.gov.pt.",
};

export default function DatasetsEditPage() {
  return <DatasetsEditClient />;
}
