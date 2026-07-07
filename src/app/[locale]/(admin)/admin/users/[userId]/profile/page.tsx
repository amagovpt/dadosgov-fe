import type { Metadata } from "next";
import UserProfileClient from "@/components/admin/users/UserProfileClient";
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
    title: t("metadata.profileTitle", { ns: "admin-users" }),
    description: t("metadata.profileDescription", { ns: "admin-users" }),
  };
}

export default function UserProfilePage() {
  return <UserProfileClient />;
}
