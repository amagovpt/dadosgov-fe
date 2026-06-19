import type { Metadata } from "next";
import DatasetsNewClient from "@/components/admin/datasets/DatasetsNewClient";

export const metadata: Metadata = {
  title: "Publique em dados.gov.pt - Admin - dados.gov.pt",
  description: "Escolha como publicar os seus dados no portal dados.gov.pt.",
};

export default function DatasetsNewPage() {
  return <DatasetsNewClient />;
}
