import type { Metadata } from "next";
import DatasetsAdminClient from "@/components/admin/datasets/publication-wizard/DatasetsAdminClient";

export const metadata: Metadata = {
  title: "Publicação assistida de conjuntos de dados - Admin - dados.gov.pt",
  description: "Publicação assistida de conjuntos de dados no portal dados.gov.pt.",
};

export default function DatasetsAdminPage() {
  return <DatasetsAdminClient />;
}
