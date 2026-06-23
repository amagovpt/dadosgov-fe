import type { Metadata } from "next";
import { Suspense } from "react";
import OrgDatasetsNewClient from "@/components/admin/datasets/views/OrgDatasetsNewClient";

export const metadata: Metadata = {
  title: "Publique em dados.gov.pt - OrganizaÃƒÂ§ÃƒÂ£o - Admin - dados.gov.pt",
  description: "Escolha como publicar os dados da organizaÃƒÂ§ÃƒÂ£o no portal dados.gov.pt.",
};

export default function OrgDatasetsNewPage() {
  return (
    <Suspense>
      <OrgDatasetsNewClient />
    </Suspense>
  );
}
