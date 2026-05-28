import TermsClient from "@/components/terms/TermsClient";
import { fetchGitHubMarkdown } from "@/app/api/github-markdown";

export default async function TermsPage() {
  const content = await fetchGitHubMarkdown("pages/faqs/terms");
  return <TermsClient initialContent={content} />;
}
