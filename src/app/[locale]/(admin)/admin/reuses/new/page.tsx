import type { Metadata } from "next";
import ReusesNewClient from "@/components/admin/reuses/views/ReusesNewClient";
import initTranslations from "@/app/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-reuses"],
  });

  return {
    title: t("metadata.newTitle", { ns: "admin-reuses" }),
    description: t("metadata.newDescription", { ns: "admin-reuses" }),
  };
}

export default function ReusesNewPage() {
  return <ReusesNewClient />;
}
