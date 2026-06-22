import type { Metadata } from "next";
import HarvestersNewClient from "@/components/admin/harvesters/HarvestersNewClient";

export const metadata: Metadata = {
  title: "Criar harvester - Admin - dados.gov.pt",
  description: "Criação de um novo harvester no portal dados.gov.pt.",
};

export default function HarvestersNewPage() {
  return <HarvestersNewClient />;
}
