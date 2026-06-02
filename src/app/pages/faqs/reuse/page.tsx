import ReuseFaqClient from "@/components/documentation/ReuseFaqClient";
import { fetchGitHubMarkdown } from "@/services/github";

export default async function ReuseFaqPage() {
  const content = await fetchGitHubMarkdown("pages/faqs/reuse");
  return <ReuseFaqClient initialContent={content} />;
}
