import PublishFaqClient from "@/components/documentation/PublishFaqClient";
import { fetchGitHubMarkdown } from "@/service/api/github-markdown";

export default async function PublishFaqPage() {
  const content = await fetchGitHubMarkdown("pages/faqs/publish");
  return <PublishFaqClient initialContent={content} />;
}
