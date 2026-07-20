import type { Metadata } from "next";
import OrgDatasetsClient from "@/components/admin/datasets/views/OrgDatasetsClient";
import initTranslations from "@/app/i18n";
import { getBoDatasets } from "@/service/queries/admin/datasets";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; orgId: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-datasets"],
  });

  return {
    title: t("metadata.orgListTitle", { ns: "admin-datasets" }),
    description: t("metadata.orgListDescription", { ns: "admin-datasets" }),
  };
}

export default async function OrgDatasetsPage({
  params,
}: {
  params: Promise<{ locale: string; orgId: string }>;
}) {
  const { locale, orgId } = await params;
  const pageContent = await getBoDatasets(locale);

  return <OrgDatasetsClient orgId={orgId} pageContent={pageContent} />;
}
