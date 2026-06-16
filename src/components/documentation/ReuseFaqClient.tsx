"use client";

import { GitHubArticlePage } from "./GitHubArticlePage";

export default function ReuseFaqClient({ initialContent }: { initialContent?: string }) {
  return (
    <GitHubArticlePage
      slug="pages/faqs/reuse"
      title="Como reutilizar dados?"
      initialContent={initialContent}
      breadcrumbItems={[
        { label: "Home", url: "/" },
        { label: "Recursos", url: "#" },
        { label: "Como reutilizar dados", url: "/pages/faqs/reuse" },
      ]}
    />
  );
}
