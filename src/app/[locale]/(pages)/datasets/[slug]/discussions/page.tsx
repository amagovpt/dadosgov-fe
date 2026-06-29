import { redirect } from "next/navigation";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const discussionId = sp.discussion_id;

  const query = new URLSearchParams({ tab: "discussions" });
  if (discussionId) {
    query.set("discussion_id", Array.isArray(discussionId) ? discussionId[0] : discussionId);
  }

  redirect(`/datasets/${slug}?${query.toString()}`);
}
