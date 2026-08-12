"use client";

import { GitHubArticlePage } from "@/components/documentation/GitHubArticlePage";

const AboutOpenData = ({ page }: { page: { metadata: { title: string }; content: string } }) => {
  return (
    <GitHubArticlePage
      slug="pages/faqs/about_opendata"
      title={page.metadata.title}
      initialContent={page.content}
    />
  );
};

export default AboutOpenData;
