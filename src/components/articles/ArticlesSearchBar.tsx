"use client";

import React, { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { InputSearchBar } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";

interface ArticlesSearchBarProps {
  initialQuery: string;
  label?: string;
  placeholder?: string;
  voiceActionAltText?: string;
  searchActionAltText?: string;
}

export function ArticlesSearchBar({ initialQuery, label, placeholder, searchActionAltText, voiceActionAltText }: ArticlesSearchBarProps) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(initialQuery);

  const handleSearch = () => {
    const query = searchInput.trim();
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    params.delete("page");
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  };

  return (
    <InputSearchBar
      label={label ?? t("search.articlesLabel")}
      placeholder={placeholder ?? t("search.articlesPlaceholder")}
      id="articles-search"
      hasVoiceActionButton={false}
      voiceActionAltText={voiceActionAltText ?? t("search.voiceAction")}
      searchActionAltText={searchActionAltText ?? t("search.label")}
      darkMode={true}
      minLength={1}
      value={searchInput}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSearch();
      }}
      onSearchActivate={() => handleSearch()}
    />
  );
}
