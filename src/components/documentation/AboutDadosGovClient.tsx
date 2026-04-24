"use client";

import { GitHubArticlePage } from "./GitHubArticlePage";

export default function AboutDadosGovClient({ initialContent }: { initialContent?: string }) {
  return (
    <GitHubArticlePage
      slug="pages/faqs/about_dadosgov"
      title="Sobre o dados.gov.pt"
      initialContent={initialContent}
      breadcrumbItems={[
        { label: "Início", url: "/" },
        { label: "Conhecimento", url: "#" },
        { label: "Sobre o dados.gov.pt", url: "/pages/faqs/about_dadosgov" },
      ]}
    />
  );
}
