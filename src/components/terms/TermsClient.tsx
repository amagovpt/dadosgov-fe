"use client";

import { GitHubMarkdownPage } from "@/components/documentation/GitHubMarkdownPage";

export default function TermsClient({ initialContent }: { initialContent?: string }) {
  return (
    <GitHubMarkdownPage
      slug="pages/faqs/terms"
      title="Termos de utilização"
      initialContent={initialContent}
      breadcrumbItems={[
        { label: "Início", url: "/" },
        { label: "Termos de utilização", url: "/termos-de-utilizacao" },
      ]}
    />
  );
}
