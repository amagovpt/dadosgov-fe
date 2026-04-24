import type { Metadata } from "next";
import UserProfileClient from "@/components/admin/users/UserProfileClient";

export const metadata: Metadata = {
  title: "Perfil do Utilizador - Admin - dados.gov.pt",
  description: "Editar perfil de utilizador no portal dados.gov.pt.",
};

export default function UserProfilePage() {
  return <UserProfileClient />;
}
