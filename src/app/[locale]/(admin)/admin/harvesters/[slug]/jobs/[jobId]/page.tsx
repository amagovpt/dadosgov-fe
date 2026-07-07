import type { Metadata } from "next";
import HarvesterJobDetailClient from "@/components/admin/harvesters/views/HarvesterJobDetailClient";
import initTranslations from "@/app/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string; jobId: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-harvesters"],
  });

  return {
    title: t("metadata.jobDetailTitle", { ns: "admin-harvesters" }),
    description: t("metadata.jobDetailDescription", { ns: "admin-harvesters" }),
  };
}

export default async function HarvesterJobDetailPage({
  params,
}: {
  params: Promise<{ slug: string; jobId: string }>;
}) {
  const { slug, jobId } = await params;
  return <HarvesterJobDetailClient slug={slug} jobId={jobId} />;
}
