import type { Metadata } from "next";
import DataservicesClient from "@/components/admin/dataservices/views/DataservicesClient";

export const metadata: Metadata = {
  title: "API - Admin - dados.gov.pt",
  description: "GestÃƒÂ£o de APIs no portal dados.gov.pt.",
};

export default function DataservicesPage() {
  return <DataservicesClient />;
}
