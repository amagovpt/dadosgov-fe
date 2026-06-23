import type { Metadata } from "next";
import NotificationsClient from "@/components/admin/notifications/NotificationsClient";

export const metadata: Metadata = {
  title: "Notificações - Admin - dados.gov.pt",
  description: "Notificações de administração no portal dados.gov.pt.",
};

export default function NotificationsPage() {
  return <NotificationsClient />;
}
