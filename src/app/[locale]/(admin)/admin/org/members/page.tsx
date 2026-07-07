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
    namespaces: ["admin-members"],
  });

  return {
    title: t("metadata.redirectTitle", { ns: "admin-members" }),
    description: t("metadata.redirectDescription", { ns: "admin-members" }),
  };
}

export default function OrgMembersRedirect() {
  return <AdminOrgRedirect targetPath="/admin/org/{orgId}/members" />;
}
