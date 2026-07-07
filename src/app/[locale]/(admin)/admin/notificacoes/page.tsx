import type { Metadata } from "next";
import NotificationsClient from "@/components/admin/notifications/NotificationsClient";
import initTranslations from "@/app/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-notifications"],
  });

  return {
    title: t("metadata.title", { ns: "admin-notifications" }),
    description: t("metadata.description", { ns: "admin-notifications" }),
  };
}

export default function NotificationsPage() {
  return <NotificationsClient />;
}
