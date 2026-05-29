import ReuseFaqClient from "@/components/documentation/ReuseFaqClient";
import { fetchGitHubMarkdown } from "@/app/api/github-markdown";

export default async function ReuseFaqPage() {
  const content = await fetchGitHubMarkdown("pages/faqs/reuse");
  return <ReuseFaqClient initialContent={content} />;
}
