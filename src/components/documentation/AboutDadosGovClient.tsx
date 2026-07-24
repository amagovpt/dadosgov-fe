"use client";

import { GitHubArticlePage } from "./GitHubArticlePage";

export default function AboutDadosGovClient({ initialContent }: { initialContent?: string }) {
  return (
    <GitHubArticlePage
      slug="pages/faqs/about_dadosgov"
      title="O que é dados.gov.pt"
      initialContent={initialContent}
    />
  );
}
