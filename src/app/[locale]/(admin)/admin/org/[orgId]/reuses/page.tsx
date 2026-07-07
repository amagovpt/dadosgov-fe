import type { Metadata } from "next";
import OrgReusesClient from "@/components/admin/reuses/views/OrgReusesClient";
import initTranslations from "@/app/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; orgId: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-reuses"],
  });

  return {
    title: t("metadata.orgTitle", { ns: "admin-reuses" }),
    description: t("metadata.orgDescription", { ns: "admin-reuses" }),
  };
}

export default async function OrgReusesPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrgReusesClient orgId={orgId} />;
}
