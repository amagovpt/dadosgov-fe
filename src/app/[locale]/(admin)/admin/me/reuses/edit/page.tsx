import type { Metadata } from "next";
import ReusesEditClient from "@/components/admin/reuses/views/ReusesEditClient";
import initTranslations from "@/app/i18n";
import { getBoReuses } from "@/service/queries/admin/reuses";

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
    title: t("metadata.editTitle", { ns: "admin-reuses" }),
    description: t("metadata.myEditDescription", { ns: "admin-reuses" }),
  };
}

export default async function ReusesEditPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoReuses(locale);

  return <ReusesEditClient pageContent={pageContent} />;
}
