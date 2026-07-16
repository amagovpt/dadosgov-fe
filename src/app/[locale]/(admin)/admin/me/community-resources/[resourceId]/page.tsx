import type { Metadata } from "next";
import CommunityResourceEditClient from "@/components/admin/community-resources/views/CommunityResourceEditClient";
import initTranslations from "@/app/i18n";
import { getBoCommunityResources } from "@/service/queries/admin/community-resources";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; resourceId: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-community-resources"],
  });

  return {
    title: t("metadata.editTitle", { ns: "admin-community-resources" }),
    description: t("metadata.editDescription", { ns: "admin-community-resources" }),
  };
}

export default async function CommunityResourcePage({
  params,
}: {
  params: Promise<{ locale: string; resourceId: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoCommunityResources(locale);

  return <CommunityResourceEditClient pageContent={pageContent} />;
}
