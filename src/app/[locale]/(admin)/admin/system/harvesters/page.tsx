import type { Metadata } from "next";
import SystemHarvestersClient from "@/components/admin/harvesters/views/SystemHarvestersClient";
import initTranslations from "@/app/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-harvesters"],
  });

  return {
    title: t("metadata.systemTitle", { ns: "admin-harvesters" }),
    description: t("metadata.systemDescription", { ns: "admin-harvesters" }),
  };
}

export default function SystemHarvestersPage() {
  return <SystemHarvestersClient />;
}
