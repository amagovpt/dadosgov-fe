"use client";

import { GitHubArticlePage } from "./GitHubArticlePage";

export default function PublishFaqClient({ initialContent }: { initialContent?: string }) {
  return (
    <GitHubArticlePage
      slug="pages/faqs/publish"
      title="Como publicar dados?"
      initialContent={initialContent}
      breadcrumbItems={[
        { label: "Início", url: "/" },
        { label: "Recursos", url: "/recursos" },
        { label: "Como usar o portal", url: "/recursos/como-usar-o-portal" },
        { label: "Como publicar dados", url: "/recursos/como-usar-o-portal/como-publicar-dados" },
      ]}
    />
  );
}
