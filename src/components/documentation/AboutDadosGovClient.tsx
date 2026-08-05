"use client";

import { GitHubArticlePage } from "./GitHubArticlePage";
import { useTranslation } from "react-i18next";

export default function AboutDadosGovClient({ initialContent }: { initialContent?: string }) {
  const { t } = useTranslation("documentation");
  return (
    <GitHubArticlePage
      slug="pages/faqs/about_dadosgov"
      title={t("aboutDadosGovTitle")}
      initialContent={initialContent}
    />
  );
}
