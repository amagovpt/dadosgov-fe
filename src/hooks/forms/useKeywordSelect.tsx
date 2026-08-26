"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DropdownOption, DropdownSection } from "@ama-pt/agora-design-system";
import { suggestTags } from "@/service/api/search";
import type { TagSuggestion } from "@/service/types/catalog";

interface UseKeywordSelectParams {
  selectedKeywords: string[];
  sectionName?: string;
  minSearchLength?: number;
  initialFetchLimit?: number;
  searchFetchLimit?: number;
  includeSelectedOutsideSuggestions?: boolean;
}

interface UseKeywordSelectReturn {
  keywordSearch: string;
  setKeywordSearch: React.Dispatch<React.SetStateAction<string>>;
  keywordOptions: React.JSX.Element;
  registerSelectedKeywordValue: (value: string) => void;
}

export function useKeywordSelect({
  selectedKeywords,
  sectionName = "keywords",
  minSearchLength = 2,
  initialFetchLimit = 50,
  searchFetchLimit = 20,
  includeSelectedOutsideSuggestions = true,
}: UseKeywordSelectParams): UseKeywordSelectReturn {
  const [tagSuggestions, setTagSuggestions] = useState<TagSuggestion[]>([]);
  const [tagSearch, setTagSearch] = useState<TagSuggestion[]>([]);
  const [keywordSearch, setKeywordSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    suggestTags("", initialFetchLimit)
      .then((results) => {
        if (!cancelled) {
          setTagSuggestions(results ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTagSuggestions([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialFetchLimit]);

  useEffect(() => {
    const query = keywordSearch.trim();
    let cancelled = false;

    if (query.length < minSearchLength) {
      return;
    }

    const timer = setTimeout(async () => {
      if (cancelled) return;

      try {
        const results = (await suggestTags(query, searchFetchLimit)) ?? [];
        if (!cancelled) {
          setTagSearch(results);
        }
      } catch {
        if (!cancelled) {
          setTagSearch([]);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [keywordSearch, minSearchLength, searchFetchLimit]);

  const keywordOptions = useMemo(() => {
    const trimmed = keywordSearch.trim();
    const trimmedLower = trimmed.toLowerCase();
    // Selected tags stay visible regardless of query so the InputSelect keeps
    // tracking them across searches; otherwise typing a new query would drop
    // them from the children and the next onChange would lose those selections.
    const selectedLowerSet = new Set(selectedKeywords.map((keyword) => keyword.toLowerCase()));
    const visibleTagSearch = trimmed.length >= minSearchLength ? tagSearch : [];
    const seen = new Set<string>();
    const uniqueTags = [...tagSuggestions, ...visibleTagSearch].filter((tag) => {
      const key = tag.text.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      if (selectedLowerSet.has(key)) return true;
      if (trimmedLower && !key.includes(trimmedLower)) return false;
      return true;
    });
    const selectedNotInSuggestions = includeSelectedOutsideSuggestions
      ? selectedKeywords.filter((keyword) => !seen.has(keyword.toLowerCase()))
      : [];
    const showCreate =
      trimmed.length > 0 &&
      ![...tagSuggestions, ...visibleTagSearch].some(
        (tag) => tag.text.toLowerCase() === trimmedLower,
      ) &&
      !selectedLowerSet.has(trimmedLower);
    const options = [
      ...(showCreate
        ? [
            <DropdownOption key={`__create__${trimmedLower}`} value={trimmed} selected={false}>
              Criar &quot;{trimmed}&quot;
            </DropdownOption>,
          ]
        : []),
      ...selectedNotInSuggestions.map((keyword) => (
        <DropdownOption key={`selected-${keyword.toLowerCase()}`} value={keyword} selected>
          {keyword}
        </DropdownOption>
      )),
      ...uniqueTags.map((tag) => (
        <DropdownOption
          key={tag.text.toLowerCase()}
          value={tag.text}
          selected={selectedLowerSet.has(tag.text.toLowerCase())}
        >
          {tag.text}
        </DropdownOption>
      )),
    ];

    return <DropdownSection name={sectionName}>{options}</DropdownSection>;
  }, [
    includeSelectedOutsideSuggestions,
    keywordSearch,
    minSearchLength,
    sectionName,
    selectedKeywords,
    tagSearch,
    tagSuggestions,
  ]);

  const registerSelectedKeywordValue = useCallback(
    (value: string) => {
      const selected = value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
      const existing = new Set(
        [...tagSuggestions, ...tagSearch].map((tag) => tag.text.toLowerCase()),
      );
      const additions = selected
        .filter((entry) => !existing.has(entry.toLowerCase()))
        .map((entry) => ({ text: entry }));

      if (additions.length === 0) {
        return;
      }

      setTagSuggestions((previous) => {
        const previousSet = new Set(previous.map((tag) => tag.text.toLowerCase()));
        const uniqueAdditions = additions.filter(
          (entry) => !previousSet.has(entry.text.toLowerCase()),
        );
        return uniqueAdditions.length > 0 ? [...previous, ...uniqueAdditions] : previous;
      });
      setKeywordSearch("");
    },
    [tagSearch, tagSuggestions],
  );

  return {
    keywordSearch,
    setKeywordSearch,
    keywordOptions,
    registerSelectedKeywordValue,
  };
}
