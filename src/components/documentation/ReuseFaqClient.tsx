"use client";

import { GitHubArticlePage } from "./GitHubArticlePage";

export default function ReuseFaqClient({ initialContent }: { initialContent?: string }) {
  return (
    <GitHubArticlePage
      slug="pages/faqs/reuse"
      title="Como reutilizar dados?"
      initialContent={initialContent}
      breadcrumbItems={[
        { label: "Início", url: "/" },
        { label: "Recursos", url: "/recursos" },
        { label: "Como usar o portal", url: "/recursos/como-usar-o-portal" },
        {
          label: "Como reutilizar dados",
          url: "/recursos/como-usar-o-portal/como-reutilizar-dados",
        },
      ]}
    />
  );
}
