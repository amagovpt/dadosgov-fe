import { GitHubArticlePage } from "./GitHubArticlePage";

export default function ReuseFaqClient({ initialContent }: { initialContent?: string }) {
  return (
    <GitHubArticlePage
      slug="pages/faqs/reuse"
      title="Como reutilizar dados?"
      initialContent={initialContent}
      breadcrumbItems={[
        { label: "Início", url: "/" },
        { label: "Conhecimento", url: "#" },
        { label: "Como reutilizar dados?", url: "/pages/faqs/reuse" },
      ]}
    />
  );
}
