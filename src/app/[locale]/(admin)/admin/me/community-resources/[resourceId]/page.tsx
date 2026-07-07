import type { Metadata } from "next";
import CommunityResourcesEditClient from "@/components/admin/community-resources/views/CommunityResourcesEditClient";
import initTranslations from "@/app/i18n";

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

export default function CommunityResourcePage() {
  return <CommunityResourcesEditClient />;
}
