"use client";

import { GitHubArticlePage } from "./GitHubArticlePage";
import type { AboutDadosGovPage } from "@/service/types/documentation/about-dadosgov";

export default function AboutDadosGovClient({ page }: { page: AboutDadosGovPage }) {
  return (
    <GitHubArticlePage
      slug="pages/faqs/about_dadosgov"
      title={page.metadata.title}
      initialContent={page.content}
    />
  );
}
