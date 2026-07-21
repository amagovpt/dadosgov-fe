import type { Metadata } from "next";
import NotificationsClient from "@/components/admin/notifications/NotificationsClient";
import {
  getBoNotifications,
  getBoNotificationsMetadata,
} from "@/service/queries/admin/notifications";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoNotificationsMetadata(locale);

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoNotifications(locale);

  return <NotificationsClient pageContent={pageContent} />;
}
