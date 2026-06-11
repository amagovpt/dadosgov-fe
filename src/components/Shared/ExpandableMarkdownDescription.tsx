"use client";

import React, { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { Icon } from "@ama-pt/agora-design-system";

const remarkPlugins = [remarkGfm];
const rehypePlugins = [rehypeRaw, rehypeSanitize];

function MarkdownBody({ markdown }: { markdown: string }) {
  return (
    <div className="mb-32 text-neutral-900 [&_a]:text-primary-600 [&_a]:underline">
      <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

type FixedClampProps = {
  variant: "fixedClamp";
  markdown: string;
  maxHeightPx?: number;
};

type SidebarAlignProps = {
  variant: "sidebarAlign";
  markdown: string;
  asideRef: React.RefObject<HTMLElement | null>;
  titleRef: React.RefObject<HTMLElement | null>;
  measureRef: React.RefObject<HTMLDivElement | null>;
  readMoreReservePx?: number;
  remeasureDeps?: React.DependencyList;
};

export type ExpandableMarkdownDescriptionProps = FixedClampProps | SidebarAlignProps;

export function ExpandableMarkdownDescription(props: ExpandableMarkdownDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const [availableHeight, setAvailableHeight] = useState<number | undefined>(undefined);

  const variant = props.variant;
  const markdown = props.markdown;
  const maxHeight =
    variant === "fixedClamp" ? (props.maxHeightPx ?? 400) : undefined;
  const readMoreReserve =
    variant === "sidebarAlign" ? (props.readMoreReservePx ?? 48) : undefined;
  const sidebarAsideRef = variant === "sidebarAlign" ? props.asideRef : undefined;
  const sidebarTitleRef = variant === "sidebarAlign" ? props.titleRef : undefined;
  const sidebarMeasureRef = variant === "sidebarAlign" ? props.measureRef : undefined;
  const sidebarRemeasureExtras =
    variant === "sidebarAlign" ? (props.remeasureDeps ?? []) : [];

  const contentRef = React.useRef<HTMLDivElement>(null);

  const checkOverflow = useCallback(() => {
    if (variant === "fixedClamp" && maxHeight !== undefined) {
      const el = contentRef.current;
      if (el) {
        const fullHeight = el.scrollHeight;
        const ov = fullHeight > maxHeight;
        setOverflowing(ov);
        if (!expanded) {
          setAvailableHeight(maxHeight);
        }
      }
      return;
    }

    if (
      variant === "sidebarAlign" &&
      sidebarMeasureRef?.current &&
      sidebarAsideRef?.current &&
      sidebarTitleRef?.current &&
      readMoreReserve !== undefined
    ) {
      const sidebarHeight = sidebarAsideRef.current.offsetHeight;
      const titleHeight = sidebarTitleRef.current.offsetHeight;
      const fullHeight = sidebarMeasureRef.current.offsetHeight;
      const maxDescHeight = sidebarHeight - titleHeight;
      const overflows = fullHeight > maxDescHeight;

      if (overflows) {
        const lineHeight =
          parseFloat(getComputedStyle(sidebarMeasureRef.current).lineHeight) || 24;
        const usable = maxDescHeight - readMoreReserve;
        const snapped = Math.floor(usable / lineHeight) * lineHeight;
        setAvailableHeight(snapped);
      } else {
        setAvailableHeight(maxDescHeight);
      }
      setOverflowing(overflows);
    }
  }, [
    expanded,
    maxHeight,
    readMoreReserve,
    sidebarAsideRef,
    sidebarMeasureRef,
    sidebarTitleRef,
    variant,
  ]);

  useEffect(() => {
    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    const observer = new ResizeObserver(checkOverflow);
    if (variant === "fixedClamp") {
      if (contentRef.current) observer.observe(contentRef.current);
    } else if (sidebarAsideRef?.current && sidebarMeasureRef?.current) {
      observer.observe(sidebarAsideRef.current);
      observer.observe(sidebarMeasureRef.current);
    }
    return () => {
      window.removeEventListener("resize", checkOverflow);
      observer.disconnect();
    };
  }, [
    checkOverflow,
    markdown,
    variant,
    expanded,
    ...sidebarRemeasureExtras,
    sidebarAsideRef,
    sidebarMeasureRef,
    sidebarTitleRef,
  ]);

  const toggle = (
    <button
      type="button"
      onClick={() => setExpanded(!expanded)}
      className="mt-8 flex cursor-pointer items-center gap-8 text-primary-600 hover:underline"
    >
      {expanded ? "Ler menos" : "Ler mais"}
      {expanded ? (
        <Icon name="agora-line-arrow-up-circle" className="h-24 w-24" />
      ) : (
        <Icon name="agora-line-arrow-down-circle" className="h-24 w-24" />
      )}
    </button>
  );

  if (variant === "fixedClamp") {
    return (
      <>
        <div
          ref={contentRef}
          className="overflow-hidden"
          style={
            !expanded && overflowing && availableHeight
              ? { maxHeight: availableHeight }
              : undefined
          }
        >
          <MarkdownBody markdown={markdown} />
        </div>
        {overflowing && toggle}
      </>
    );
  }

  return (
    <>
      <div
        ref={sidebarMeasureRef}
        className="pointer-events-none invisible absolute"
        style={{ top: 0, left: 0, right: 0 }}
        aria-hidden="true"
      >
        <MarkdownBody markdown={markdown} />
      </div>
      <div
        className="overflow-hidden"
        style={
          !expanded && overflowing && availableHeight
            ? { maxHeight: availableHeight }
            : undefined
        }
      >
        <MarkdownBody markdown={markdown} />
      </div>
      {overflowing && toggle}
    </>
  );
}
