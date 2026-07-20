import type { Metadata } from "next";
import OrgDataservicesClient from "@/components/admin/dataservices/views/OrgDataservicesClient";
import initTranslations from "@/app/i18n";
import { getBoDataservices } from "@/service/queries/admin/dataservices";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; orgId: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-dataservices"],
  });

  return {
    title: t("metadata.orgTitle", { ns: "admin-dataservices" }),
    description: t("metadata.orgDescription", { ns: "admin-dataservices" }),
  };
}

export default async function OrgDataservicesPage({
  params,
}: {
  params: Promise<{ locale: string; orgId: string }>;
}) {
  const { locale, orgId } = await params;
  const pageContent = await getBoDataservices(locale);

  return <OrgDataservicesClient orgId={orgId} pageContent={pageContent} />;
}
