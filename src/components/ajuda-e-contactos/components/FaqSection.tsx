"use client";

import React from "react";
import type { FaqCategory } from "@/service/types/support";
import { FaqAccordionItem } from "./FaqAccordionItem";

interface FaqSectionProps {
  title: string;
  updatedDate: string;
  categories: FaqCategory[];
}

export function FaqSection({ title, updatedDate, categories }: FaqSectionProps) {
  const enabledCategories = React.useMemo(
    () =>
      categories
        .filter((category) => category.enabled !== false)
        .map((category) => ({
          ...category,
          items: category.items.filter((item) => item.enabled !== false),
        })),
    [categories]
  );
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const handleExpanded = (id: string) => setExpandedId(id);
  const handleCollapsed = (id: string) => {
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div id="faq" className="mx-auto max-w-4xl scroll-mt-[190px]">
      <p className="text-sm mb-32 text-neutral-700">{updatedDate}</p>
      <h2 className="mb-32 text-xl-semibold text-primary-900">{title}</h2>

      <div className="space-y-48">
        {enabledCategories.map((category, idx) => (
          <section
            key={category.id}
            id={category.id}
            className={`${idx > 0 ? "mt-32" : ""} scroll-mt-[190px]`}
          >
            <h3 className="mb-16 text-[20px] font-bold text-[#021C51]">{category.title}</h3>
            <div>
              {category.items.map((item, itemIdx) => {
                const currentId = `${idx}-${itemIdx}`;
                return (
                  <FaqAccordionItem
                    key={currentId}
                    item={item}
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
