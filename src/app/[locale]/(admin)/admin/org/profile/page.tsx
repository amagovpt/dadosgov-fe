import type { Metadata } from "next";
import AdminOrgRedirect from "@/components/admin/AdminOrgRedirect";
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
    title: t("organization.metadata.redirectTitle", { ns: "admin-profile" }),
    description: t("organization.metadata.redirectDescription", { ns: "admin-profile" }),
  };
}

export default function OrgProfileRedirect() {
  return <AdminOrgRedirect targetPath="/admin/org/{orgId}/profile" />;
}
