"use client";

import React from "react";
import type { AnchoredFaqCategory } from "@/service/types/support";
import { FaqAccordionItem } from "./FaqAccordionItem";

interface FaqSectionProps {
  title: string;
  updatedDate: string;
  /** Enabled categories, each with only its enabled items. */
  categories: AnchoredFaqCategory[];
  /** Current URL hash, without the leading `#`. */
  hash: string;
}

export function FaqSection({ title, updatedDate, categories, hash }: FaqSectionProps) {
  const anchorToId = React.useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category, idx) =>
      category.items.forEach((item, itemIdx) => map.set(item.anchor, `${idx}-${itemIdx}`))
    );
    return map;
  }, [categories]);

  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  // A hash naming a question opens its accordion. Adjusted during render (not in an effect) so
  // the accordion is already open in the commit that scrolls to it. Starts at "" because the
  // hash is only known after hydration.
  const [handledHash, setHandledHash] = React.useState("");
  if (hash !== handledHash) {
    setHandledHash(hash);
    const targetId = anchorToId.get(hash);
    if (targetId) setExpandedId(targetId);
  }

  // The browser scrolls to the anchor on load, but before hydration and before the accordion
  // opens; on in-page hash changes the accordion remounts. Scroll again once it is open.
  React.useEffect(() => {
    if (!anchorToId.has(hash)) return;
    const frame = requestAnimationFrame(() =>
      document.getElementById(hash)?.scrollIntoView({ block: "start" })
    );
    return () => cancelAnimationFrame(frame);
  }, [hash, anchorToId]);

  const handleExpanded = (id: string) => setExpandedId(id);
  const handleCollapsed = (id: string) => {
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div id="faq" className="mx-auto max-w-4xl">
      <p className="text-sm mb-32 text-neutral-700">{updatedDate}</p>
      <h2 className="mb-32 text-xl-semibold text-primary-900">{title}</h2>

      <div className="space-y-48">
        {categories.map((category, idx) => (
          <section
            key={category.id}
            id={category.id}
            className={`${idx > 0 ? "mt-32" : ""} !scroll-mt-[200px]`}
          >
            <h3 className="mb-16 text-[20px] font-bold text-[#021C51]">{category.title}</h3>
            <div>
              {category.items.map((item, itemIdx) => {
                const currentId = `${idx}-${itemIdx}`;
                return (
                  <FaqAccordionItem
                    key={currentId}
                    item={item}
                    anchorId={item.anchor}
                    currentId={currentId}
                    expandedId={expandedId}
                    onExpanded={handleExpanded}
                    onCollapsed={handleCollapsed}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
