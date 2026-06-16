"use client";

import { GitHubArticlePage } from "./GitHubArticlePage";

export default function PublishFaqClient({ initialContent }: { initialContent?: string }) {
  return (
    <GitHubArticlePage
      slug="pages/faqs/publish"
      title="Como publicar dados?"
      initialContent={initialContent}
      breadcrumbItems={[
        { label: "Home", url: "/" },
        { label: "Recursos", url: "#" },
        { label: "Como publicar dados", url: "/pages/faqs/publish" },
      ]}
    />
  );
}
