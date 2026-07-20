import type { Metadata } from "next";
import OrgCommunityResourcesClient from "@/components/admin/community-resources/views/OrgCommunityResourcesClient";
import initTranslations from "@/app/i18n";
import { getBoCommunityResources } from "@/service/queries/admin/community-resources";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; orgId: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-community-resources"],
  });

  return {
    title: t("metadata.orgTitle", { ns: "admin-community-resources" }),
    description: t("metadata.orgDescription", { ns: "admin-community-resources" }),
  };
}

export default async function OrgCommunityResourcesPage({
  params,
}: {
  params: Promise<{ locale: string; orgId: string }>;
}) {
  const { locale, orgId } = await params;
  const pageContent = await getBoCommunityResources(locale);

  return <OrgCommunityResourcesClient orgId={orgId} pageContent={pageContent} />;
}
