import type { Metadata } from "next";
import { Suspense } from "react";
import DatasetsClient from "@/components/admin/datasets/DatasetsClient";

export const metadata: Metadata = {
  title: "Conjunto de dados - Admin - dados.gov.pt",
  description: "Gestão de conjuntos de dados no portal dados.gov.pt.",
};

export default function DatasetsPage() {
  return (
    <Suspense>
      <DatasetsClient />
    </Suspense>
  );
}
