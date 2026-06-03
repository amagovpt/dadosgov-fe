"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Discussion } from "@/service/types/discussion";

export function useDiscussionsFeed(
  loadKey: string | null | undefined,
  load: () => Promise<{ data: Discussion[]; total: number }>,
) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadRef = useRef(load);
  useLayoutEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    if (!loadKey) {
      const id = window.setTimeout(() => {
        setDiscussions([]);
        setTotal(0);
        setIsLoading(false);
      }, 0);
      return () => window.clearTimeout(id);
    }
    let cancelled = false;
    void (async () => {
      window.setTimeout(() => {
        if (!cancelled) setIsLoading(true);
      }, 0);
      try {
        const response = await loadRef.current();
        if (!cancelled) {
          setDiscussions(response.data);
          setTotal(response.total);
        }
      } catch (error) {
        console.error("Error loading discussions:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadKey]);

  return {
    discussions,
    setDiscussions,
    discussionCount: total,
    setDiscussionCount: setTotal,
    isLoadingDiscussions: isLoading,
  };
}
