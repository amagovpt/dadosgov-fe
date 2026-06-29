import ReuseDetailClient from "@/components/reuses/ReuseDetailClient";

export default async function Page({
  params,
}: {
  params: Promise<{ rid: string }>;
}) {
  const { rid } = await params;

  return <ReuseDetailClient slug={rid} />;
}
