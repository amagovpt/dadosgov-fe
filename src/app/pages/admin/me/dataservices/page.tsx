import type { Metadata } from "next";
import DataservicesClient from "@/components/admin/dataservices/DataservicesClient";

export const metadata: Metadata = {
  title: "API - Admin - dados.gov.pt",
  description: "Gestão de APIs no portal dados.gov.pt.",
};

export default function DataservicesPage() {
  return <DataservicesClient />;
}
