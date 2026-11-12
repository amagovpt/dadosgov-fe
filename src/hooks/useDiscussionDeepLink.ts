"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import type { Discussion } from "@/service/types/discussion";
import { fetchDiscussion } from "@/service/api/discussions-topics";

const subscribeHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export function useDiscussionTab() {
  const searchParams = useSearchParams();
  const isDiscussionTab =
    searchParams.get("tab") === "discussions" || Boolean(searchParams.get("discussion_id"));
  const hydrated = useSyncExternalStore(subscribeHydration, clientReady, serverReady);
  // Agora measures width during hydration. Remount linked tabs once on the client
  // so their mobile panels do not retain the server's desktop `hidden` attributes.
  return {
    isDiscussionTab,
    tabsKey: isDiscussionTab && hydrated ? "linked-discussion" : "default",
  };
}

interface DiscussionDeepLinkOptions {
  entityId: string;
  entityClass: string;
  discussions: Discussion[];
  isLoading: boolean;
  onDiscussionLoaded: (discussion: Discussion) => void;
}

export function useDiscussionDeepLink({
  entityId,
  entityClass,
  discussions,
  isLoading,
  onDiscussionLoaded,
}: DiscussionDeepLinkOptions) {
  const searchParams = useSearchParams();
  const targetId = searchParams.get("discussion_id")?.trim() || "";
  const targetRef = useRef<HTMLElement | null>(null);
  const resultKey = JSON.stringify([entityClass, entityId, targetId]);
  const [unavailableKey, setUnavailableKey] = useState<string | null>(null);
  const existingTarget = discussions.find(
    (discussion) =>
      discussion.id === targetId &&
      discussion.subject?.id === entityId &&
      discussion.subject?.class === entityClass
  );
  const existingTargetId = existingTarget?.id;

  useEffect(() => {
    if (!targetId || existingTargetId || isLoading) return;
    let cancelled = false;
    void fetchDiscussion(targetId).then((discussion) => {
      if (cancelled) return;
      const belongsToPage =
        discussion?.id === targetId &&
        discussion.subject?.id === entityId &&
        discussion.subject?.class === entityClass;
      if (discussion && belongsToPage) onDiscussionLoaded(discussion);
      else setUnavailableKey(resultKey);
    });
    return () => {
      cancelled = true;
    };
  }, [targetId, existingTargetId, isLoading, entityId, entityClass, resultKey, onDiscussionLoaded]);

  useEffect(() => {
    const element = targetRef.current;
    if (!targetId || !existingTargetId || !element) return;
    let focused = false;
    const focusTarget = () => {
      // Tab panels may mount their content before they become visible.
      if (focused || element.getClientRects().length === 0) return;
      focused = true;
      observer?.disconnect();
      element.focus({ preventScroll: true });
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      element.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "center" });
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(focusTarget);
    observer?.observe(element);
    const frame = requestAnimationFrame(focusTarget);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [targetId, existingTargetId]);

  return {
    targetId,
    targetRef,
    isUnavailable: Boolean(targetId && !existingTargetId && unavailableKey === resultKey),
  };
}
