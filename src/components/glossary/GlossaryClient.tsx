"use client";

import React, { MouseEvent, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { GlossaryLetter, GlossaryLetters, InputSearchBar } from "@ama-pt/agora-design-system";
import { Typograph } from "@/components/Shared/Generics/Typograph";
import type { GlossaryEntry } from "@/service/types/glossary";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { highlightText } from "@/utils/highlightText";
import { GLOSSARY_ALPHABET, filterGlossary, groupByFirstLetter } from "@/utils/glossary";

const SEARCH_PARAM = "pesquisar";
const SEARCH_DEBOUNCE_MS = 300;

interface GlossaryClientProps {
  entries: GlossaryEntry[];
  initialQuery?: string;
}

export function GlossaryClient({ entries, initialQuery = "" }: GlossaryClientProps) {
  const { t } = useTranslation("common");
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  // Debounce the search and mirror it in the URL (?pesquisar=) without a navigation.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query);
      const url = new URL(window.location.href);
      if (query.trim()) url.searchParams.set(SEARCH_PARAM, query.trim());
      else url.searchParams.delete(SEARCH_PARAM);
      window.history.replaceState(window.history.state, "", url);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query]);

  const groups = useMemo(
    () => groupByFirstLetter(filterGlossary(entries, debouncedQuery)),
    [entries, debouncedQuery]
  );

  const resultCount = useMemo(
    () => groups.reduce((total, group) => total + group.items.length, 0),
    [groups]
  );

  const letters = useMemo<GlossaryLetter[]>(() => {
    const available = new Set(groups.map((group) => group.letter));
    return GLOSSARY_ALPHABET.map((letter) => ({
      letter,
      href: `#${letter}`,
      "aria-label": t("glossary.linkForLetter", { letter }),
      "data-glossary-letter": letter,
      status: !available.has(letter)
        ? "disabled"
        : letter === selectedLetter
          ? "selected"
          : "default",
    }));
  }, [groups, selectedLetter, t]);

  // When searching, bring the first matching group into view.
  useEffect(() => {
    if (!debouncedQuery.trim() || groups.length === 0) return;
    document
      .getElementById(groups[0].letter)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [debouncedQuery, groups]);

  const handleLetterClick = (event: MouseEvent<HTMLDivElement>) => {
    const letter = (event.target as HTMLElement)
      .closest("[data-glossary-letter]")
      ?.getAttribute("data-glossary-letter");
    if (letter) setSelectedLetter(letter);
  };

  return (
    <div className="container flex w-full flex-col gap-32 pt-24 pb-64 lg:gap-64">
      <div className="max-w-[800px]">
        <InputSearchBar
          id="glossary-search"
          label={t("glossary.searchLabel")}
          placeholder={t("glossary.searchPlaceholder")}
          searchActionAltText={t("glossary.searchActionAltText")}
          hasVoiceActionButton={false}
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          onSearchActivate={(term: string) => setQuery(term)}
        />
      </div>

      <Typograph
        tag="p"
        className="border-b border-neutral-200 pb-12 text-right text-m-regular text-neutral-700"
      >
        {t("glossary.foundResults", { count: resultCount })}
      </Typograph>

      <div className="grid grid-cols-12 items-start gap-32 xl:gap-0">
        <div className="sticky top-64 z-10 col-span-12 self-start bg-white pb-32 xl:col-span-3 xl:pb-0">
          <div className="flex flex-col gap-32 xl:gap-64">
            <div className="hidden xl:block">
              <GlossaryLetters
                id="glossary-letters-navbar"
                aria-label={t("glossary.lettersNavigation")}
                letters={letters}
                onClick={handleLetterClick}
              />
            </div>
          </div>
        </div>

        <div className="col-span-12 flex flex-col gap-64 xl:col-span-9 xl:pl-128">
          {groups.length === 0 ? (
            <Typograph tag="p" className="text-m-regular text-neutral-700">
              {t("glossary.noResults")}
            </Typograph>
          ) : (
            <div className="flex flex-col gap-96">
              {groups.map((group) => (
                <section
                  key={group.letter}
                  id={group.letter}
                  aria-labelledby={`glossary-letter-${group.letter}`}
                  className="flex flex-col gap-32"
                >
                  <div className="flex h-64 w-64 items-center justify-center rounded-full bg-primary-200">
                    <Typograph
                      tag="h2"
                      id={`glossary-letter-${group.letter}`}
                      className="text-l-bold text-primary-600"
                    >
                      {group.letter}
                    </Typograph>
                  </div>
                  {group.items.map((item) => (
                    <div key={item.word} className="flex flex-col gap-8 text-pretty md:w-[80%]">
                      <Typograph
                        tag="h3"
                        className="text-xl-bold! text-neutral-900 [&_span]:text-xl-bold!"
                      >
                        {highlightText(item.word, debouncedQuery, {
                          highlightClassName: "underline",
                        })}
                      </Typograph>
                      <div className="flex flex-col gap-16 text-m-regular text-neutral-900">
                        {formatHtmlParagraphs(item.description)}
                      </div>
                    </div>
                  ))}
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
