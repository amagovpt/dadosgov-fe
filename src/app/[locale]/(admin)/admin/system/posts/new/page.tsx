import type { Metadata } from "next";
import PostsNewClient from "@/components/admin/posts/views/PostsNewClient";
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
    title: t("metadata.newTitle", { ns: "admin-posts" }),
    description: t("metadata.newDescription", { ns: "admin-posts" }),
  };
}

export default function PostsNewPage() {
  return <PostsNewClient />;
}
