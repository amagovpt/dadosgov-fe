"use client";

import {
  useCallback,
  useEffect,
  useOptimistic,
  useRef,
  useSyncExternalStore,
  useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  DropdownOption,
  DropdownSection,
  InputSelect,
  InputSelectRef,
} from "@ama-pt/agora-design-system";
import {
  ArticlesSort,
  ARTICLES_SORT_LABEL_KEYS,
  parseArticlesSort,
} from "@/utils/articlesListing";

interface ArticlesSortSelectProps {
  currentSort: ArticlesSort;
}

export function ArticlesSortSelect({ currentSort }: ArticlesSortSelectProps) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [optimisticSort, setOptimisticSort] = useOptimistic(currentSort);

  const selectRef = useRef<InputSelectRef>(null);
  const lastValue = useRef<string>(currentSort);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const handleSortChange = useCallback(
    (sort: ArticlesSort) => {
      startTransition(() => {
        setOptimisticSort(sort);
        const params = new URLSearchParams(searchParams.toString());
        if (sort === "recentes") {
          params.delete("sort");
        } else {
          params.set("sort", sort);
        }
        params.delete("page");
        const qs = params.toString();
        router.push(`${pathname}${qs ? `?${qs}` : ""}`);
      });
    },
    [pathname, router, searchParams, setOptimisticSort]
  );

  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      const selected = selectRef.current?.selectedOptions?.[0]?.value;
      if (selected && selected !== lastValue.current) {
        lastValue.current = selected;
        handleSortChange(parseArticlesSort(selected));
      }
    }, 150);
    return () => clearInterval(interval);
  }, [mounted, handleSortChange]);

  if (!mounted) {
    return (
      <div className="selectArticle">
        <label className="mb-4 block text-s-regular text-neutral-700">{t("sortBy")}</label>
        <div className="w-full rounded-8 border border-neutral-300 bg-white px-16 py-12 text-m-regular text-neutral-900">
          {t(ARTICLES_SORT_LABEL_KEYS[optimisticSort])}
        </div>
      </div>
    );
  }

  return (
    <InputSelect label={t("sortBy")} id="sort-articles" className="selectArticle" ref={selectRef}>
      <DropdownSection name="order">
        {Object.entries(ARTICLES_SORT_LABEL_KEYS).map(([key, labelKey]) => (
          <DropdownOption key={key} value={key} selected={optimisticSort === key}>
            {t(labelKey)}
          </DropdownOption>
        ))}
      </DropdownSection>
    </InputSelect>
  );
}
