import type { Metadata } from "next";
import SystemHarvestersClient from "@/components/admin/harvesters/SystemHarvestersClient";

export const metadata: Metadata = {
  title: "Harvesters - Sistema - Admin - dados.gov.pt",
  description: "Gestão de harvesters do sistema no portal dados.gov.pt.",
};

export default function SystemHarvestersPage() {
  return <SystemHarvestersClient />;
}
