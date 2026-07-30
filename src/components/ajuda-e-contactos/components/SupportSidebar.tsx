"use client";

import type { FaqCategory } from "@/service/types/support";

interface SupportSidebarProps {
  activeItem: string;
  categories: FaqCategory[];
  currentLabel: string;
  helpLabel: string;
  onItemClick: (item: string) => void;
}

export function SupportSidebar({
  activeItem,
  categories,
  currentLabel,
  helpLabel,
  onItemClick,
}: SupportSidebarProps) {
  const enabledCategories = categories.filter((category) => category.enabled !== false);

  return (
    <div className="sidebar-index border-l border-neutral-700 pr-64">
      <ul>
        <li className="mb-16 cursor-pointer" onClick={() => onItemClick("current")}>
          <a
            href="#nesta-pagina"
            className={`text-neutral-900 ${activeItem === "current" ? "text-m-bold font-bold" : "text-m-regular"}`}
            style={activeItem === "current" ? { fontWeight: 700 } : {}}
          >
            {currentLabel}
          </a>
        </li>

        {enabledCategories.map((category) => {
          const slug = category.id;
          return (
            <li key={slug} className="mb-8 cursor-pointer" onClick={() => onItemClick(slug)}>
              <a
                href={`#${slug}`}
                className={`text-neutral-900 ${activeItem === slug ? "text-m-bold font-bold" : "text-m-regular"}`}
                style={activeItem === slug ? { fontWeight: 700 } : {}}
              >
                {category.title}
              </a>
            </li>
          );
        })}

        <li className="cursor-pointer" onClick={() => onItemClick("help")}>
          <a
            href="#help"
            className={`text-neutral-900 ${activeItem === "help" ? "text-m-bold font-bold" : "text-m-regular"}`}
            style={activeItem === "help" ? { fontWeight: 700 } : {}}
          >
            {helpLabel}
          </a>
        </li>
      </ul>
    </div>
  );
}
