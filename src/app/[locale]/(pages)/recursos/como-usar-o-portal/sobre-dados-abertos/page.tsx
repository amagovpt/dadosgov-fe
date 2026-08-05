import AboutOpenData from "@/components/articles/AboutOpenData";
import { fetchGitHubMarkdown } from "@/service/api/github-markdown";
import { Metadata } from "next";
import initTranslations from "@/app/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations({ locale, namespaces: ["documentation"] });

  return {
    title: `${t("aboutOpenData.metadataTitle")} - dados.gov.pt`,
    description: t("aboutOpenData.metadataDescription"),
  };
}

export default async function AboutOpenDataPage() {
  const content = await fetchGitHubMarkdown("pages/faqs/about_opendata");
  return <AboutOpenData initialContent={content} />;
}
