"use client";

import { GitHubArticlePage } from "./GitHubArticlePage";

export default function AboutDadosGovClient({ initialContent }: { initialContent?: string }) {
  return (
    <GitHubArticlePage
      slug="pages/faqs/about_dadosgov"
      title="O que é dados.gov.pt"
      initialContent={initialContent}
      breadcrumbItems={[
        { label: "Início", url: "/" },
        { label: "Recursos", url: "/recursos" },
        { label: "Como usar o portal", url: "/recursos/como-usar-o-portal" },
        { label: "O que é dados.gov.pt", url: "/recursos/como-usar-o-portal/o-que-e-dados-gov-pt" },
      ]}
    />
  );
}
