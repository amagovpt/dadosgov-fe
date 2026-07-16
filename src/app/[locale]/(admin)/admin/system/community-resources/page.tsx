import type { Metadata } from "next";
import SystemCommunityResourcesClient from "@/components/admin/community-resources/views/SystemCommunityResourcesClient";
import initTranslations from "@/app/i18n";
import { getBoCommunityResources } from "@/service/queries/admin/community-resources";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-community-resources"],
  });

  return {
    title: t("metadata.systemTitle", { ns: "admin-community-resources" }),
    description: t("metadata.systemDescription", { ns: "admin-community-resources" }),
  };
}

export default async function SystemCommunityResourcesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoCommunityResources(locale);

  return <SystemCommunityResourcesClient pageContent={pageContent} />;
}
