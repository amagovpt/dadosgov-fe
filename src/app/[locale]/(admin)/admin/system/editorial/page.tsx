import type { Metadata } from "next";
import SystemEditorialClient from "@/components/admin/editorial/SystemEditorialClient";

export const metadata: Metadata = {
  title: "Editorial - Sistema - Admin - dados.gov.pt",
  description: "Gestão editorial do sistema no portal dados.gov.pt.",
};

export default function SystemEditorialPage() {
  return <SystemEditorialClient />;
}
