import type { Metadata } from "next";
import SystemUsersClient from "@/components/admin/users/SystemUsersClient";

export const metadata: Metadata = {
  title: "Utilizadores - Sistema - Admin - dados.gov.pt",
  description: "Gestão de utilizadores do sistema no portal dados.gov.pt.",
};

export default function SystemUsersPage() {
  return <SystemUsersClient />;
}
