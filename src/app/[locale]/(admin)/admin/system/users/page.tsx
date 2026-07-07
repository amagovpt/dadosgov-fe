import type { Metadata } from "next";
import SystemUsersClient from "@/components/admin/users/SystemUsersClient";
import initTranslations from "@/app/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-users"],
  });

  return {
    title: t("metadata.systemUsersTitle", { ns: "admin-users" }),
    description: t("metadata.systemUsersDescription", { ns: "admin-users" }),
  };
}

export default function SystemUsersPage() {
  return <SystemUsersClient />;
}
