"use client";

import React, { useState } from "react";
import { Icon } from "@ama-pt/agora-design-system";

export interface AuxiliarItem {
  title: string;
  content: React.ReactNode;
  hasError?: boolean;
  hidden?: boolean;
}

interface AuxiliarListProps {
  items: AuxiliarItem[];
}

export default function AuxiliarList({ items }: AuxiliarListProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <ul className="auxiliar-list">
      {items.filter((item) => !item.hidden).map((item, idx) => (
        <li key={idx}>
          <button
            type="button"
            className="auxiliar-list__item"
            onClick={() => toggle(idx)}
            aria-expanded={openIndex === idx}
          >
            <span
              className="auxiliar-list__icon"
              style={item.hasError ? { color: "#d32f2f" } : undefined}
            >
              <Icon
                name={item.hasError ? "agora-line-x" : "agora-line-minus"}
                dimensions="s"
              />
            </span>
            <span className="auxiliar-list__text">{item.title}</span>
            <Icon
              name={openIndex === idx ? "agora-line-chevron-up" : "agora-line-chevron-down"}
              className="auxiliar-list__chevron"
            />
          </button>
          {openIndex === idx && (
            <div className="auxiliar-list__content">
              {item.content}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
