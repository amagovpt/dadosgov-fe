import type { Metadata } from "next";
import initTranslations from "@/app/i18n";
import DiscussionsListClient from "@/components/admin/discussions/DiscussionsListClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({ locale, namespaces: ["admin-discussions"] });

  return {
    title: t("system.title"),
    description: t("system.description"),
  };
}

export default function SystemDiscussionsPage() {
  return <DiscussionsListClient scope="system" />;
}
