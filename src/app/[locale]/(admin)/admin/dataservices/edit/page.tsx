import type { Metadata } from "next";
import DataservicesEditClient from "@/components/admin/dataservices/DataservicesEditClient";

export const metadata: Metadata = {
  title: "Editar API - Admin - dados.gov.pt",
  description: "Edição de APIs no portal dados.gov.pt.",
};

export default function DataservicesEditPage() {
  return <DataservicesEditClient />;
}
