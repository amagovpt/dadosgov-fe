import type { Metadata } from "next";
import SystemPostsClient from "@/components/admin/posts/views/SystemPostsClient";
import initTranslations from "@/app/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({
    locale,
    namespaces: ["admin-posts"],
  });

  return {
    title: t("metadata.systemTitle", { ns: "admin-posts" }),
    description: t("metadata.systemDescription", { ns: "admin-posts" }),
  };
}

export default function SystemPostsPage() {
  return <SystemPostsClient />;
}
