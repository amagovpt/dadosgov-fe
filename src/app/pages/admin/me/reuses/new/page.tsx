import type { Metadata } from "next";
import ReusesNewClient from "@/components/admin/reuses/views/ReusesNewClient";

export const metadata: Metadata = {
  title: "Descreva a sua reutilizaÃƒÂ§ÃƒÂ£o - Admin - dados.gov.pt",
  description:
    "FormulÃƒÂ¡rio de inscriÃƒÂ§ÃƒÂ£o para novas reutilizaÃƒÂ§ÃƒÂµes no portal dados.gov.pt.",
};

export default function ReusesNewPage() {
  return <ReusesNewClient />;
}
