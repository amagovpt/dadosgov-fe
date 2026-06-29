"use client";

import { FAQ_DATA } from "../constants";
import { slugify } from "../utils";

interface SupportSidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
}

export function SupportSidebar({ activeItem, onItemClick }: SupportSidebarProps) {
  return (
    <div className="sidebar-index border-l border-neutral-700 pr-64">
      <ul>
        <li className="mb-16 cursor-pointer" onClick={() => onItemClick("Nesta página")}>
          <a
            href="#nesta-pagina"
            className={`text-neutral-900 ${activeItem === "Nesta página" ? "text-m-bold font-bold" : "text-m-regular"}`}
            style={activeItem === "Nesta página" ? { fontWeight: 700 } : {}}
          >
            Nesta página
          </a>
        </li>

        {FAQ_DATA.map((category) => {
          const slug = slugify(category.category);
          return (
            <li
              key={slug}
              className="mb-8 cursor-pointer"
              onClick={() => onItemClick(category.category)}
            >
              <a
                href={`#${slug}`}
                className={`text-neutral-900 ${activeItem === category.category ? "text-m-bold font-bold" : "text-m-regular"}`}
                style={activeItem === category.category ? { fontWeight: 700 } : {}}
              >
                {category.category}
              </a>
            </li>
          );
        })}

        <li className="cursor-pointer" onClick={() => onItemClick("Ajuda")}>
          <a
            href="#ajuda"
            className={`text-neutral-900 ${activeItem === "Ajuda" ? "text-m-bold font-bold" : "text-m-regular"}`}
            style={activeItem === "Ajuda" ? { fontWeight: 700 } : {}}
          >
            Ajuda
          </a>
        </li>
      </ul>
    </div>
  );
}
