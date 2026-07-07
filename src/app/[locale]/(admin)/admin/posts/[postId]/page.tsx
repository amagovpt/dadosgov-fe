import type { Metadata } from "next";
import { Suspense } from "react";
import PostsEditClient from "@/components/admin/posts/views/PostsEditClient";
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
    title: t("metadata.editTitle", { ns: "admin-posts" }),
    description: t("metadata.editDescription", { ns: "admin-posts" }),
  };
}

export default function PostEditPage() {
  return (
    <Suspense>
      <PostsEditClient />
    </Suspense>
  );
}
