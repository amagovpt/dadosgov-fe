import type { Metadata } from "next";
import OrgHarvestersClient from "@/components/admin/harvesters/views/OrgHarvestersClient";
import initTranslations from "@/app/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; orgId: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-harvesters"],
  });

  return {
    title: t("metadata.orgTitle", { ns: "admin-harvesters" }),
    description: t("metadata.orgDescription", { ns: "admin-harvesters" }),
  };
}

export default async function OrgHarvestersPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrgHarvestersClient orgId={orgId} />;
}
