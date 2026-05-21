import TermsClient from "@/components/terms/TermsClient";
import { fetchGitHubMarkdown } from "@/service/utils/github";

export default async function TermsPage() {
  const content = await fetchGitHubMarkdown("pages/faqs/terms");
  return <TermsClient initialContent={content} />;
}
