import type { Metadata } from "next";
import HarvestersNewClient from "@/components/admin/harvesters/views/HarvestersNewClient";
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
    title: t("metadata.newTitle", { ns: "admin-harvesters" }),
    description: t("metadata.newDescription", { ns: "admin-harvesters" }),
  };
}

export default function HarvestersNewPage() {
  return <HarvestersNewClient />;
}
