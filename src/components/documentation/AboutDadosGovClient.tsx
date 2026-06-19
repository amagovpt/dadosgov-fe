"use client";

import { GitHubArticlePage } from "./GitHubArticlePage";

export default function AboutDadosGovClient({ initialContent }: { initialContent?: string }) {
  return (
    <GitHubArticlePage
      slug="pages/faqs/about_dadosgov"
      title="O que é dados.gov.pt"
      initialContent={initialContent}
      breadcrumbItems={[
        { label: "Home", url: "/" },
        { label: "Recursos", url: "#" },
        { label: "Como usar o portal", url: "#" },
        { label: "O que é dados.gov.pt", url: "/pages/faqs/about_dadosgov" },
      ]}
    />
  );
}
