import type { Metadata } from "next";
import HarvesterDetailClient from "@/components/admin/harvesters/views/HarvesterDetailClient";
import initTranslations from "@/app/i18n";
import { getBoHarvesters } from "@/service/queries/admin/harvesters";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-harvesters"],
  });

  return {
    title: t("metadata.detailTitle", { ns: "admin-harvesters" }),
    description: t("metadata.detailDescription", { ns: "admin-harvesters" }),
  };
}

export default async function HarvesterDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const pageContent = await getBoHarvesters(locale);
  return <HarvesterDetailClient slug={slug} pageContent={pageContent} />;
}
