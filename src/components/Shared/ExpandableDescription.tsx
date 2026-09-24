"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@ama-pt/agora-design-system";
import { twMerge } from "tailwind-merge";

interface ExpandableDescriptionProps {
  children: React.ReactNode;
  sidebarRef: React.RefObject<HTMLDivElement | null>;
  titleRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
  extraContent?: React.ReactNode;
}

const READMORE_BUTTON_HEIGHT = 48;

export function ExpandableDescription({
  children,
  sidebarRef,
  titleRef,
  className,
  extraContent,
}: ExpandableDescriptionProps) {
  const { t } = useTranslation("common");
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [availableHeight, setAvailableHeight] = useState<number | undefined>(undefined);
  const measureRef = useRef<HTMLDivElement>(null);

  const checkOverflow = useCallback(() => {
    if (measureRef.current && sidebarRef.current && titleRef.current) {
      const sidebarHeight = sidebarRef.current.offsetHeight;
      const titleHeight = titleRef.current.offsetHeight;
      const fullHeight = measureRef.current.offsetHeight;
      const maxDescHeight = sidebarHeight - titleHeight;
      const overflows = fullHeight > maxDescHeight;
      if (overflows) {
        const lineHeight = parseFloat(getComputedStyle(measureRef.current).lineHeight) || 24;
        const usable = maxDescHeight - READMORE_BUTTON_HEIGHT;
        const snapped = Math.floor(usable / lineHeight) * lineHeight;
        setAvailableHeight(snapped);
      } else {
        setAvailableHeight(maxDescHeight);
      }
      setIsOverflowing(overflows);
    }
  }, [sidebarRef, titleRef]);

  useEffect(() => {
    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    const observer = new ResizeObserver(checkOverflow);
    if (sidebarRef.current) observer.observe(sidebarRef.current);
    if (measureRef.current) observer.observe(measureRef.current);
    return () => {
      window.removeEventListener("resize", checkOverflow);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkOverflow, children]);

  return (
    <div className={twMerge("prose max-w-ch text-lg relative mb-12 max-w-none leading-relaxed text-neutral-700", className)}>
      {/* Hidden measure element to get full content height */}
      <div
        ref={measureRef}
        className="pointer-events-none invisible absolute"
        style={{ top: 0, left: 0, right: 0 }}
        aria-hidden="true"
      >
        {children}
        {extraContent}
      </div>
      <div
        className="overflow-hidden"
        style={
          !expanded && isOverflowing && availableHeight ? { maxHeight: availableHeight } : undefined
        }
      >
        {children}
        {extraContent}
      </div>
      {isOverflowing && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-8 flex cursor-pointer items-center gap-8 text-primary-600 hover:underline"
        >
          {expanded ? t("readLess") : t("readMore")}
          {expanded ? (
            <Icon name="agora-line-arrow-up-circle" className="h-24 w-24" />
          ) : (
            <Icon name="agora-line-arrow-down-circle" className="h-24 w-24" />
          )}
        </button>
      )}
    </div>
  );
}
