"use client";

import { GitHubArticlePage } from "@/components/documentation/GitHubArticlePage";

const AboutOpenData = ({ initialContent }: { initialContent?: string }) => {
  const processedContent = initialContent?.replace(
    /\[diretiva europeia\]\([^)]*\)(?:\s*\([^)]*\))?/gi,
    "[diretiva europeia](https://eur-lex.europa.eu/legal-content/PT/LSU/?uri=CELEX:32019L1024)"
  );

  return (
    <GitHubArticlePage
      slug="pages/faqs/about_opendata"
      initialContent={processedContent}
      breadcrumbItems={[
        { label: "Início", url: "/" },
        { label: "Recursos", url: "/recursos" },
        { label: "Como usar o portal", url: "/recursos/como-usar-o-portal" },
        { label: "Sobre dados abertos", url: "/recursos/como-usar-o-portal/sobre-dados-abertos" },
      ]}
    />
  );
};

export default AboutOpenData;
