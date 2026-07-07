import type { Metadata } from "next";
import HarvesterDetailClient from "@/components/admin/harvesters/views/HarvesterDetailClient";
import initTranslations from "@/app/i18n";

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
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <HarvesterDetailClient slug={slug} />;
}
