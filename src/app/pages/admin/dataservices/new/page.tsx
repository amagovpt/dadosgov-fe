import type { Metadata } from "next";
import ApiNewClient from "@/components/admin/dataservices/ApiNewClient";

export const metadata: Metadata = {
  title: "Descreva a sua API - Admin - dados.gov.pt",
  description: "Formulário de inscrição para novas APIs no portal dados.gov.pt.",
};

export default function ApiRegistrationPage() {
  return <ApiNewClient />;
}
