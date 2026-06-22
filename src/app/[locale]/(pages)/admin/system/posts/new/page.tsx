import type { Metadata } from "next";
import PostsNewClient from "@/components/admin/posts/PostsNewClient";

export const metadata: Metadata = {
  title: "Criar artigo - Admin - dados.gov.pt",
  description: "Criação de um novo artigo no portal dados.gov.pt.",
};

export default function PostsNewPage() {
  return <PostsNewClient />;
}
