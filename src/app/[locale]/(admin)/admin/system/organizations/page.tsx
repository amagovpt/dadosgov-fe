import type { Metadata } from "next";
import SystemOrganizationsClient from "@/components/admin/organizations/SystemOrganizationsClient";
import initTranslations from "@/app/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-organizations"],
  });

  return {
    title: t("metadata.systemTitle", { ns: "admin-organizations" }),
    description: t("metadata.systemDescription", { ns: "admin-organizations" }),
  };
}

export default function SystemOrganizationsPage() {
  return <SystemOrganizationsClient />;
}
