import React, { useState, useEffect, useMemo, useRef } from "react";
import { DropdownOption, DropdownSection } from "@ama-pt/agora-design-system";
import { suggestTags } from "@/app/api/search";
import type { TagSuggestion } from "@/service/types/catalog";

export interface UsePostKeywordsReturn {
  keywordSearch: string;
  setKeywordSearch: (v: string) => void;
  keywordOptions: React.JSX.Element;
  selectedKeywordsRef: React.RefObject<string>;
  addCustomTag: (text: string) => void;
}

export function usePostKeywords(selectedTags: string[]): UsePostKeywordsReturn {
  const [tags, setTags] = useState<TagSuggestion[]>([]);
  const [tagSearch, setTagSearch] = useState<TagSuggestion[]>([]);
  const [keywordSearch, setKeywordSearch] = useState("");
  const selectedKeywordsRef = useRef("");

  useEffect(() => {
    suggestTags("", 50).then(setTags);
  }, []);

  useEffect(() => {
    const q = keywordSearch.trim();
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      if (q.length < 2) {
        setTagSearch([]);
        return;
      }
      try {
        const res = await suggestTags(q, 20);
        if (!cancelled) setTagSearch(res);
      } catch {
        if (!cancelled) setTagSearch([]);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      cancelled = true;
    };
  }, [keywordSearch]);

  const keywordOptions = useMemo(() => {
    const trimmed = keywordSearch.trim();
    const trimmedLower = trimmed.toLowerCase();
    // Selected tags stay visible regardless of query so the InputSelect keeps
    // tracking them across searches; otherwise typing a new query would drop
    // them from the children and the next onChange would lose those selections.
    const selectedLowerSet = new Set(selectedTags.map((k) => k.toLowerCase()));
    const seen = new Set<string>();
    const visibleTagSearch = trimmed.length < 2 ? [] : tagSearch;
    const uniqueTags = [...tags, ...visibleTagSearch].filter((t) => {
      const key = t.text.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      if (selectedLowerSet.has(key)) return true;
      if (trimmedLower && !key.includes(trimmedLower)) return false;
      return true;
    });
    const selectedNotInSuggestions = selectedTags.filter(
      (keyword) => !seen.has(keyword.toLowerCase()),
    );
    const showCreate =
      trimmed.length > 0 &&
      ![...tags, ...tagSearch].some((t) => t.text.toLowerCase() === trimmedLower) &&
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
    return <DropdownSection name="keywords">{options}</DropdownSection>;
  }, [tags, tagSearch, selectedTags, keywordSearch]);

  const addCustomTag = (text: string) => {
    const lower = text.toLowerCase();
    setTags((prev) => {
      if (prev.some((t) => t.text.toLowerCase() === lower)) return prev;
      return [...prev, { text }];
    });
  };

  return { keywordSearch, setKeywordSearch, keywordOptions, selectedKeywordsRef, addCustomTag };
}
