import type { Metadata } from "next";
import OrgProfileClient from "@/components/admin/profile/organization/OrgProfileClient";
import initTranslations from "@/app/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-profile"],
  });

  return {
    title: t("organization.metadata.pageTitle", { ns: "admin-profile" }),
    description: t("organization.metadata.pageDescription", { ns: "admin-profile" }),
  };
}

export default function OrgProfilePage() {
  return <OrgProfileClient />;
}
