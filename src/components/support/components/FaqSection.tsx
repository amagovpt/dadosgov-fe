"use client";

import React from "react";
import { FAQ_DATA, FAQ_UPDATED_DATE } from "../constants";
import { slugify } from "../utils";
import { FaqAccordionItem } from "./FaqAccordionItem";

export function FaqSection() {
  const [expandedId, setExpandedId] = React.useState<string | null>("0-1");

  const handleExpanded = (id: string) => setExpandedId(id);
  const handleCollapsed = (id: string) => {
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div id="faq" className="mx-auto max-w-4xl scroll-mt-[190px]">
      <p className="text-sm mb-32 text-neutral-700">{FAQ_UPDATED_DATE}</p>
      <h2 className="mb-32 text-xl-semibold text-primary-900">Perguntas frequentes</h2>

      <div className="space-y-48">
        {FAQ_DATA.map((category, idx) => (
          <section
            key={idx}
            id={slugify(category.category)}
            className={`${category.category !== "Sobre dados específicos" ? "mt-32" : ""} scroll-mt-[190px]`}
          >
            <h3 className="mb-16 text-[20px] font-bold text-[#021C51]">{category.category}</h3>
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
