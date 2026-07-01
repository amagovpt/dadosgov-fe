import DataserviceDetailClient from "@/components/dataservices/DataserviceDetailClient";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <DataserviceDetailClient slug={slug} />;
}
