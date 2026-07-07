import type { Metadata } from "next";
import MembersClient from "@/components/admin/members/MembersClient";
import initTranslations from "@/app/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; orgId: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-members"],
  });

  return {
    title: t("metadata.pageTitle", { ns: "admin-members" }),
    description: t("metadata.pageDescription", { ns: "admin-members" }),
  };
}

export default async function MembersPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <MembersClient orgId={orgId} />;
}
