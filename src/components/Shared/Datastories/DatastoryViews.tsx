"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MetricItem } from "@/components/Shared/MetricItem";
import { trackDatastoryView } from "@/service/api/datastories";

export type DatastoryViewsProps = {
  slug: string;
};

/**
 * Reports the visit and shows the datastory view count.
 *
 * One request does both: the POST that records the visit answers with the current total.
 * The ref keeps a visit from being reported twice when React re-runs the effect (Strict
 * Mode in development), and is keyed by slug so navigating to another datastory counts it.
 * Renders nothing until the count is known, and nothing at all if the backend is down.
 */
export function DatastoryViews({ slug }: DatastoryViewsProps) {
  const { t } = useTranslation("common");
  const [views, setViews] = useState<number | null>(null);
  const trackedSlug = useRef<string | null>(null);

  useEffect(() => {
    if (!slug || trackedSlug.current === slug) return;
    trackedSlug.current = slug;
    trackDatastoryView(slug).then((result) => {
      if (result) setViews(result.metrics.views);
    });
  }, [slug]);

  if (views === null) return null;

  return (
    <span className="text-m-regular">
      <MetricItem icon="agora-line-eye" value={views} label={t("card.views")} tone="light" />
    </span>
  );
}
