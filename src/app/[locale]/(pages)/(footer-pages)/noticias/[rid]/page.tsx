import ArticleDetail from "@/components/articles/ArticleDetail";

export default async function ArticleDetailPage({ params }: { params: Promise<{ rid: string }> }) {
  const { rid } = await params;
  return <ArticleDetail rid={rid} />;
}
