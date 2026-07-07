import type { Metadata } from "next";
import CommunityResourcesClient from "@/components/admin/community-resources/views/CommunityResourcesClient";
import initTranslations from "@/app/i18n";

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
    title: t("metadata.listTitle", { ns: "admin-community-resources" }),
    description: t("metadata.listDescription", { ns: "admin-community-resources" }),
  };
}

export default function CommunityResourcesPage() {
  return <CommunityResourcesClient />;
}
