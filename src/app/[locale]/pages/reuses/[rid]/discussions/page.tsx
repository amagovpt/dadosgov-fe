import { redirect } from "next/navigation";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ rid: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { rid } = await params;
  const sp = await searchParams;
  const discussionId = sp.discussion_id;

  const query = new URLSearchParams({ tab: "discussions" });
  if (discussionId) {
    query.set("discussion_id", Array.isArray(discussionId) ? discussionId[0] : discussionId);
  }

  redirect(`/pages/reuses/${rid}?${query.toString()}`);
}
