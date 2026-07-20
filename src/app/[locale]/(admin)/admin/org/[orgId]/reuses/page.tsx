import type { Metadata } from "next";
import OrgReusesClient from "@/components/admin/reuses/views/OrgReusesClient";
import initTranslations from "@/app/i18n";
import { getBoReuses } from "@/service/queries/admin/reuses";

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
  params: Promise<{ locale: string; orgId: string }>;
}) {
  const { locale, orgId } = await params;
  const pageContent = await getBoReuses(locale);

  return <OrgReusesClient orgId={orgId} pageContent={pageContent} />;
}
