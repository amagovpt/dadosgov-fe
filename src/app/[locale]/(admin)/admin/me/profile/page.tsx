import type { Metadata } from "next";
import ProfileClient from "@/components/admin/profile/user/ProfileClient";
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
    title: t("metadata.title", { ns: "admin-profile" }),
    description: t("metadata.description", { ns: "admin-profile" }),
  };
}

export default function ProfilePage() {
  return <ProfileClient />;
}
