import type { Metadata } from "next";
import ReusesEditClient from "@/components/admin/reuses/views/ReusesEditClient";

export const metadata: Metadata = {
  title: "Editar reutilização - Admin - dados.gov.pt",
  description: "Edição das minhas reutilizações no portal dados.gov.pt.",
};

export default function ReusesEditPage() {
  return <ReusesEditClient />;
}
