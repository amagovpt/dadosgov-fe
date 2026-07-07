import type { Metadata } from "next";
import CommunityResourcesNewClient from "@/components/admin/community-resources/views/CommunityResourcesNewClient";
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
    title: t("metadata.newTitle", { ns: "admin-community-resources" }),
    description: t("metadata.newDescription", { ns: "admin-community-resources" }),
  };
}

export default function CommunityResourcesNewPage() {
  return <CommunityResourcesNewClient />;
}
