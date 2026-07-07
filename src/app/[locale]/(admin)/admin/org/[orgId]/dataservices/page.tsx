import type { Metadata } from "next";
import OrgDataservicesClient from "@/components/admin/dataservices/views/OrgDataservicesClient";
import initTranslations from "@/app/i18n";

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
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrgDataservicesClient orgId={orgId} />;
}
