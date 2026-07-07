import type { Metadata } from "next";
import { Suspense } from "react";
import OrgDatasetsNewClient from "@/components/admin/datasets/views/OrgDatasetsNewClient";

export const metadata: Metadata = {
  title: "Publicar conjuntos de dados da organização - Admin - dados.gov.pt",
  description: "Publicação de conjuntos de dados da organização no portal dados.gov.pt.",
};

export default function OrgDatasetsNewPage() {
  return (
    <Suspense>
      <OrgDatasetsNewClient />
    </Suspense>
  );
}
