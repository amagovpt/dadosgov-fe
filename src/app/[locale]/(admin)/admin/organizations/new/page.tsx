import type { Metadata } from "next";
import OrganizationsNewClient from "@/components/admin/organizations/OrganizationsNewClient";
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
    title: t("metadata.newTitle", { ns: "admin-organizations" }),
    description: t("metadata.newDescription", { ns: "admin-organizations" }),
  };
}

export default function OrganizationsNewPage() {
  return <OrganizationsNewClient />;
}
