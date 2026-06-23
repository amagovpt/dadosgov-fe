import type { Metadata } from "next";
import { Suspense } from "react";
import OrgDatasetsNewClient from "@/components/admin/datasets/OrgDatasetsNewClient";

export const metadata: Metadata = {
  title: "Publique em dados.gov.pt - Organização - Admin - dados.gov.pt",
  description: "Escolha como publicar os dados da organização no portal dados.gov.pt.",
};

export default function OrgDatasetsNewPage() {
  return (
    <Suspense>
      <OrgDatasetsNewClient />
    </Suspense>
  );
}
