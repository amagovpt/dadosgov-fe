import type { Metadata } from "next";
import DatasetsAdminWizardClient from "./DatasetsAdminWizardClient";

export const metadata: Metadata = {
  title: "Publicar conjunto de dados - Admin - dados.gov.pt",
  description: "Publicação assistida de conjuntos de dados no portal dados.gov.pt.",
};

export default function DatasetsAdminPage() {
  return <DatasetsAdminWizardClient />;
}
