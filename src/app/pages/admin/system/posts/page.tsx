import type { Metadata } from "next";
import SystemPostsClient from "@/components/admin/posts/views/SystemPostsClient";

export const metadata: Metadata = {
  title: "Artigos - Sistema - Admin - dados.gov.pt",
  description: "GestÃƒÂ£o de artigos do sistema no portal dados.gov.pt.",
};

export default function SystemPostsPage() {
  return <SystemPostsClient />;
}
