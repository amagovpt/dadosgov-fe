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
        { label: "Conhecimento", url: "#" },
        { label: "Sobre dados abertos", url: "/pages/about-open-data" },
      ]}
    />
  );
};

export default AboutOpenData;
