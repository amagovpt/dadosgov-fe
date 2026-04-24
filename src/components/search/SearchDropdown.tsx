"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { InputSearchBar } from "@ama-pt/agora-design-system";

type SearchType = "datasets" | "dataservices" | "reuses" | "organizations";

const SEARCH_OPTIONS: { type: SearchType; label: string; path: string }[] = [
  { type: "datasets", label: "conjuntos de dados", path: "/pages/datasets" },
  { type: "dataservices", label: "APIs", path: "/pages/dataservices" },
  { type: "reuses", label: "reutilizações", path: "/pages/reuses" },
  { type: "organizations", label: "organizações", path: "/pages/organizations" },
];

interface SearchDropdownProps {
  id: string;
  darkMode?: boolean;
  placeholder?: string;
  label?: string;
  hasVoiceActionButton?: boolean;
  excludeTypes?: SearchType[];
}

export default function SearchDropdown({
  id,
  darkMode = false,
  placeholder = "Pesquisar conjunto de dados, organizações, reutilizações...",
  label = "Pesquisar",
  hasVoiceActionButton = false,
  excludeTypes = [],
}: SearchDropdownProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fullPath = `${pathname}?${searchParams.toString()}`;
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const queryRef = useRef("");
  const isOpenRef = useRef(false);
  const activeIndexRef = useRef(-1);
  const options = SEARCH_OPTIONS.filter((o) => !excludeTypes.includes(o.type));

  // Keep refs in sync with state so stale-closure callbacks always read current values
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
  useEffect(() => { activeIndexRef.current = activeIndex; }, [activeIndex]);

  // Close and reset on every navigation (pathname OR query string change)
  useEffect(() => {
    setIsOpen(false);
    setQuery("");
    queryRef.current = "";
    const input = wrapperRef.current?.querySelector("input");
    if (input) input.value = "";
  }, [fullPath]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen for input changes via native event on the wrapper
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.tagName === "INPUT") {
        const val = target.value;
        queryRef.current = val;
        setQuery(val);
        setIsOpen(val.trim().length > 0);
        setActiveIndex(-1);
      }
    };

    wrapper.addEventListener("input", handleInput);
    return () => wrapper.removeEventListener("input", handleInput);
  }, []);

  const navigateToSearch = (type: SearchType) => {
    const domInput = wrapperRef.current?.querySelector("input");
    const q = (domInput?.value || queryRef.current).trim();
    if (q) {
      const option = options.find((o) => o.type === type);
      const path = option?.path || "/pages/datasets";
      router.push(`${path}?q=${encodeURIComponent(q)}`);
      setIsOpen(false);
      queryRef.current = "";
      setQuery("");
      if (domInput) domInput.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpenRef.current) {
      if (e.key === "Enter" && queryRef.current.trim()) {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < options.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : options.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndexRef.current >= 0) {
          navigateToSearch(options[activeIndexRef.current].type);
        } else {
          navigateToSearch("datasets");
        }
        break;
      case "Escape":
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  const handleSearchActivate = () => {
    const domInput = wrapperRef.current?.querySelector("input");
    const q = (domInput?.value || queryRef.current).trim();
    if (q) {
      navigateToSearch("datasets");
    }
  };

  return (
    <div ref={wrapperRef} className="relative" style={{ zIndex: 40 }}>
      <InputSearchBar
        label={label}
        placeholder={placeholder}
        id={id}
        onKeyDown={handleKeyDown}
        onSearchActivate={handleSearchActivate}
        darkMode={darkMode}
        hasVoiceActionButton={hasVoiceActionButton}
        voiceActionAltText="Pesquisar por voz"
        searchActionAltText="Pesquisar"
        autoComplete="off"
      />

      {isOpen && query.trim() && (
        <div
          className="absolute w-full bg-white overflow-hidden"
          style={{
            zIndex: 9999,
            border: "1px solid #0C1932",
            borderTop: "1px solid #DCE1E8",
            borderRadius: "0 0 8px 8px",
          }}
        >
          <ul className="list-none m-0 p-0" role="listbox">
            {options.map((option, index) => (
              <li
                key={option.type}
                role="option"
                aria-selected={activeIndex === index}
                style={{
                  padding: "10px 16px",
                  cursor: "pointer",
                  backgroundColor:
                    activeIndex === index ? "#F7F7FF" : "white",
                  borderTop: index > 0 ? "1px solid #DCE1E8" : "none",
                  fontSize: "14px",
                  color: "#2B363C",
                  transition: "background-color 0.15s",
                }}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(-1)}
                onClick={() => navigateToSearch(option.type)}
              >
                Pesquisar{" "}
                <strong>&laquo;{query.trim()}&raquo;</strong>{" "}
                nos/nas <strong>{option.label}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
