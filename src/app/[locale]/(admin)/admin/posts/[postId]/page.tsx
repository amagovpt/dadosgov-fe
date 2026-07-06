import type { Metadata } from "next";
import { Suspense } from "react";
import PostsEditClient from "@/components/admin/posts/views/PostsEditClient";

export const metadata: Metadata = {
  title: "Editar artigo - Admin - dados.gov.pt",
  description: "Edição de artigos no portal dados.gov.pt.",
};

export default function PostEditPage() {
  return (
    <Suspense>
      <PostsEditClient />
    </Suspense>
  );
}
