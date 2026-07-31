"use client";

import type { FaqCategory } from "@/service/types/support";

interface SupportSidebarProps {
  activeItem: string;
  categories: FaqCategory[];
  currentAnchorId: string;
  currentLabel: string;
  helpAnchorId: string;
  helpLabel: string;
}

export function SupportSidebar({
  activeItem,
  categories,
  currentAnchorId,
  currentLabel,
  helpAnchorId,
  helpLabel,
}: SupportSidebarProps) {
  const enabledCategories = categories.filter((category) => category.enabled !== false);

  return (
    <div className="sidebar-index border-l border-neutral-700 pr-64">
      <ul>
        <li className="mb-16 cursor-pointer">
          <a
            href={`#${currentAnchorId}`}
            className={`text-neutral-900 inline-block w-full ${activeItem === currentAnchorId ? "text-m-bold font-bold" : "text-m-regular"}`}
            style={activeItem === currentAnchorId ? { fontWeight: 700 } : {}}
          >
            {currentLabel}
          </a>
        </li>

        {enabledCategories.map((category) => {
          const slug = category.id;
          return (
            <li key={slug} className="mb-8 cursor-pointer">
              <a
                href={`#${slug}`}
                className={`text-neutral-900 inline-block w-full ${activeItem === slug ? "text-m-bold font-bold" : "text-m-regular"}`}
                style={activeItem === slug ? { fontWeight: 700 } : {}}
              >
                {category.title}
              </a>
            </li>
          );
        })}

        <li className="cursor-pointer">
          <a
            href={`#${helpAnchorId}`}
            className={`text-neutral-900 inline-block w-full ${activeItem === helpAnchorId ? "text-m-bold font-bold" : "text-m-regular"}`}
            style={activeItem === helpAnchorId ? { fontWeight: 700 } : {}}
          >
            {helpLabel}
          </a>
        </li>
      </ul>
    </div>
  );
}
