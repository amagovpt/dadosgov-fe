import type { Metadata } from "next";
import PostsNewClient from "@/components/admin/posts/views/PostsNewClient";
import { getBoPosts, getBoPostsMetadata } from "@/service/queries/admin/posts";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getBoPostsMetadata(locale, "createMetadata");

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function PostsNewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pageContent = await getBoPosts(locale);

  return <PostsNewClient pageContent={pageContent} />;
}
