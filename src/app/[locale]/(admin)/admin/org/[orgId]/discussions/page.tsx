import type { Metadata } from "next";
import OrgDiscussionsClient from "@/components/admin/discussions/OrgDiscussionsClient";
import initTranslations from "@/app/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; orgId: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-discussions"],
  });

  return {
    title: t("metadata.orgTitle", { ns: "admin-discussions" }),
    description: t("metadata.orgDescription", { ns: "admin-discussions" }),
  };
}

export default async function OrgDiscussionsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrgDiscussionsClient orgId={orgId} />;
}
