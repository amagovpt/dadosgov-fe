import type { Metadata } from "next";
import SystemEditorialClient from "@/components/admin/editorial/SystemEditorialClient";
import initTranslations from "@/app/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-editorial"],
  });

  return {
    title: t("metadata.title", { ns: "admin-editorial" }),
    description: t("metadata.description", { ns: "admin-editorial" }),
  };
}

export default function SystemEditorialPage() {
  return <SystemEditorialClient />;
}
