import { GitHubArticlePage } from "./GitHubArticlePage";

export default function PublishFaqClient({ initialContent }: { initialContent?: string }) {
  return (
    <GitHubArticlePage
      slug="pages/faqs/publish"
      title="Como publicar dados?"
      initialContent={initialContent}
      breadcrumbItems={[
        { label: "Início", url: "/" },
        { label: "Conhecimento", url: "#" },
        { label: "Como publicar dados?", url: "/pages/faqs/publish" },
      ]}
    />
  );
}
