"use client";

import React, { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { InputSearchBar } from "@ama-pt/agora-design-system";

interface ArticlesSearchBarProps {
  initialQuery: string;
  label?: string;
  placeholder?: string;
  voiceActionAltText?: string;
  searchActionAltText?: string;
}

export function ArticlesSearchBar({ initialQuery, label, placeholder, searchActionAltText, voiceActionAltText }: ArticlesSearchBarProps) {
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
      label={label ?? "O que procura nas novidades?"}
      placeholder={placeholder ?? "Pesquisar artigos, notícias, webinars..."}
      id="articles-search"
      hasVoiceActionButton={false}
      voiceActionAltText={voiceActionAltText ?? "Pesquisar por voz"}
      searchActionAltText={searchActionAltText ?? "Pesquisar"}
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
