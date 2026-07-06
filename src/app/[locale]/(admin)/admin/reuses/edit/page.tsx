import type { Metadata } from "next";
import ReusesEditClient from "@/components/admin/reuses/views/ReusesEditClient";

export const metadata: Metadata = {
  title: "Editar reutilização - Admin - dados.gov.pt",
  description: "Edição de reutilizações no portal dados.gov.pt.",
};

export default function ReusesEditPage() {
  return <ReusesEditClient />;
}
