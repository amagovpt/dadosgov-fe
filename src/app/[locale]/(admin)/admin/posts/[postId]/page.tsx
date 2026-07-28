import type { Metadata } from "next";
import { Suspense } from "react";
import PostsEditClient from "@/components/admin/posts/views/PostsEditClient";
import { getBoPosts, getBoPostsMetadata } from "@/service/queries/admin/posts";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoPostsMetadata(locale, "editMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function PostEditPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoPosts(locale);

  return (
    <Suspense>
      <PostsEditClient pageContent={pageContent} />
    </Suspense>
  );
}
