import AboutDadosGovClient from "@/components/documentation/AboutDadosGovClient";
import { fetchGitHubMarkdown } from "@/service/utils/github";

export default async function AboutDadosGovPage() {
  const content = await fetchGitHubMarkdown("pages/faqs/about_dadosgov");
  return <AboutDadosGovClient initialContent={content} />;
}
