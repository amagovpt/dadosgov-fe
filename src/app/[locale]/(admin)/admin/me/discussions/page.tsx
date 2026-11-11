import type { Metadata } from "next";
import initTranslations from "@/app/i18n";
import DiscussionsClient from "@/components/admin/discussions/DiscussionsClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({ locale, namespaces: ["admin-discussions"] });

  return {
    title: t("personal.title"),
    description: t("personal.description"),
  };
}

export default function PersonalDiscussionsPage() {
  return <DiscussionsClient />;
}
