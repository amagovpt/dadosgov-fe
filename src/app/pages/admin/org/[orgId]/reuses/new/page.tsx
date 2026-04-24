import type { Metadata } from "next";
import OrgReusesNewClient from "@/components/admin/reuses/OrgReusesNewClient";

export const metadata: Metadata = {
  title: "Nova reutilização - Organização - Admin - dados.gov.pt",
  description: "Publique uma nova reutilização da organização no portal dados.gov.pt.",
};

export default function OrgReusesNewPage() {
  return <OrgReusesNewClient />;
}
