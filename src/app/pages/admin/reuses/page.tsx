import type { Metadata } from "next";
import ReusesClient from "@/components/admin/reuses/ReusesClient";

export const metadata: Metadata = {
  title: "Reutilizações - Admin - dados.gov.pt",
  description: "Gestão de reutilizações no portal dados.gov.pt.",
};

export default function ReusesPage() {
  return <ReusesClient />;
}
