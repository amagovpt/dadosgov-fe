"use client";

import { useEffect, useRef } from "react";
import { trackDatastoryView } from "@/service/api/datastories";

export type DatastoryViewTrackerProps = {
  slug: string;
};

export function DatastoryViewTracker({ slug }: DatastoryViewTrackerProps) {
  const trackedSlug = useRef<string | null>(null);

  useEffect(() => {
    if (!slug || trackedSlug.current === slug) return;
    trackedSlug.current = slug;
    void trackDatastoryView(slug);
  }, [slug]);

  return null;
}
