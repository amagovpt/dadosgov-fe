import AboutOpenData from "@/components/articles/AboutOpenData";
import { fetchGitHubMarkdown } from "@/services/github";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre dados abertos - dados.gov.pt",
  description: "Saiba o que são dados abertos e qual a sua importância.",
};

export default async function AboutOpenDataPage() {
  const content = await fetchGitHubMarkdown("pages/faqs/about_opendata");
  return <AboutOpenData initialContent={content} />;
}
