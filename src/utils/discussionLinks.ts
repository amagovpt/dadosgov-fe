import type { Discussion } from "@/service/types/discussion";

const SUBJECT_PATHS = new Map([
  ["Dataset", "datasets"],
  ["Reuse", "reuses"],
  ["Organization", "organizations"],
  ["Dataservice", "dataservices"],
]);

export function getDiscussionAnchorId(id: string, instanceId?: string): string {
  return `discussion-${id}${instanceId ? `-${instanceId}` : ""}`;
}

/** Discussion.url is an API endpoint; public navigation uses its subject instead. */
export function getDiscussionHref(discussion: Pick<Discussion, "id" | "subject">): string | null {
  const path = SUBJECT_PATHS.get(discussion.subject?.class);
  if (!path || !discussion.subject?.id || !discussion.id) return null;
  const query = new URLSearchParams({ tab: "discussions", discussion_id: discussion.id });
  return `/${path}/${encodeURIComponent(discussion.subject.id)}?${query}`;
}
