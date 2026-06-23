import type { Metadata } from "next";
import ReusesClient from "@/components/admin/reuses/views/ReusesClient";

export const metadata: Metadata = {
  title: "ReutilizaÃƒÂ§ÃƒÂµes - Admin - dados.gov.pt",
  description: "GestÃƒÂ£o de reutilizaÃƒÂ§ÃƒÂµes no portal dados.gov.pt.",
};

export default function ReusesPage() {
  return <ReusesClient />;
}
