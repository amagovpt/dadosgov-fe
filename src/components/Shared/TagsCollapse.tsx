"use client";

import React, { useEffect, useRef, useState } from "react";
import { Pill } from "@ama-pt/agora-design-system";
import { SeeMoreToggle } from "@/components/Shared/SeeMoreToggle";

interface TagsCollapseProps {
  tags: string[];
  title: string;
  titleClassName?: string;
  rootClassName?: string;
  pillClassName?: string;
  toggleClassName?: string;
  toggleIconClassName?: string;
  toggleTextClassName?: string;
}

export const TagsCollapse: React.FC<TagsCollapseProps> = ({
  tags,
  title,
  titleClassName = "text-sm font-bold tracking-wider mb-8",
  rootClassName = "relative w-full",
  pillClassName = "bg-primary-100 text-primary-700 h-auto py-2 px-6 text-xs font-medium whitespace-nowrap shrink-0",
  toggleClassName = "mt-8 inline-flex items-center gap-4 bg-transparent border-0 p-0 text-m-regular text-primary-600 hover:text-primary-900",
  toggleIconClassName = "h-20 w-20",
  toggleTextClassName = "text-s-regular",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [firstRowCount, setFirstRowCount] = useState<number>(tags.length);
  const [containerWidth, setContainerWidth] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Collapse back to the first row whenever the tag set changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsExpanded(false);
  }, [tags]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const updateWidth = () => {
      const nextWidth = Math.floor(root.clientWidth);
      if (nextWidth > 0) setContainerWidth(nextWidth);
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(root);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!tags.length || !containerWidth) {
      // Nothing measurable yet; show every tag until a width is known.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFirstRowCount(tags.length);
      return;
    }

    const measure = () => {
      const container = measureRef.current;
      if (!container) return;

      const items = Array.from(
        container.querySelectorAll<HTMLElement>("[data-tags-measure-item='true']")
      );
      if (!items.length) {
        setFirstRowCount(0);
        return;
      }

      const firstTop = items[0].offsetTop;
      const nextRowIndex = items.findIndex((item) => item.offsetTop > firstTop + 1);
      const count = nextRowIndex === -1 ? items.length : nextRowIndex;
      setFirstRowCount(Math.max(1, count));
    };

    const rafId = window.requestAnimationFrame(measure);
    const t1 = window.setTimeout(measure, 50);
    const t2 = window.setTimeout(measure, 200);
    document.fonts?.ready?.then(measure);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [tags, containerWidth]);

  if (!tags.length) return null;

  const visibleTags = isExpanded ? tags : tags.slice(0, firstRowCount);
  const shouldShowToggle = tags.length > firstRowCount;

  return (
    <div ref={rootRef} className={rootClassName}>
      <p className={titleClassName}>{title}</p>

      <div className="absolute inset-x-0 top-0 invisible pointer-events-none" aria-hidden="true">
        <div
          ref={measureRef}
          className="flex flex-wrap items-start gap-8"
          style={{ width: containerWidth ? `${containerWidth}px` : undefined }}
        >
          {tags.map((tag, index) => (
            <div key={`measure-${tag}-${index}`} data-tags-measure-item="true" className="shrink-0">
              <Pill appearance="solid" variant="primary" className={pillClassName}>
                {tag}
              </Pill>
            </div>
          ))}
        </div>
      </div>

      <div className={`flex items-start gap-8 overflow-hidden ${isExpanded ? "flex-wrap" : "flex-nowrap"}`}>
        {visibleTags.map((tag, index) => (
          <Pill key={`${tag}-${index}`} appearance="solid" variant="primary" className={pillClassName}>
            {tag}
          </Pill>
        ))}
      </div>

      {shouldShowToggle && (
        <SeeMoreToggle
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded((prev) => !prev)}
          className={toggleClassName}
          iconClassName={toggleIconClassName}
          textClassName={toggleTextClassName}
        />
      )}
    </div>
  );
};
