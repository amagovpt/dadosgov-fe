import type { Metadata } from "next";
import ProfileClient from "@/components/admin/profile/user/ProfileClient";

export const metadata: Metadata = {
  title: "Perfil - Admin - dados.gov.pt",
  description: "Perfil do utilizador no portal dados.gov.pt.",
};

export default function ProfilePage() {
  return <ProfileClient />;
}
