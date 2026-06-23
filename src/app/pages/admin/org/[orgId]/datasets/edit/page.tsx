import type { Metadata } from "next";
import DatasetsEditClient from "@/components/admin/datasets/views/DatasetsEditClient";

export const metadata: Metadata = {
  title: "Editar conjunto de dados - OrganizaÃƒÂ§ÃƒÂ£o - Admin - dados.gov.pt",
  description: "Editar conjunto de dados da organizaÃƒÂ§ÃƒÂ£o no portal dados.gov.pt.",
};

export default function OrgDatasetsEditPage() {
  return <DatasetsEditClient />;
}
