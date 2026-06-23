import type { Metadata } from "next";
import ReusesNewClient from "@/components/admin/reuses/ReusesNewClient";

export const metadata: Metadata = {
  title: "Descreva a sua reutilização - Admin - dados.gov.pt",
  description:
    "Formulário de inscrição para novas reutilizações no portal dados.gov.pt.",
};

export default function ReusesNewPage() {
  return <ReusesNewClient />;
}
