import type { Metadata } from "next";
import ReusesEditClient from "@/components/admin/reuses/ReusesEditClient";

export const metadata: Metadata = {
  title: "Editar reutilização - Organização - Admin - dados.gov.pt",
  description: "Editar reutilização da organização no portal dados.gov.pt.",
};

export default function OrgReusesEditPage() {
  return <ReusesEditClient />;
}
