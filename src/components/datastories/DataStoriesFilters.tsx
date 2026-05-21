"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@ama-pt/agora-design-system";
import { suggestTags } from "@/app/api/search";
import { Datastories } from "@/service/types/datastories";
import { DataStoriesFilterState, DataStoriesToggleState } from "@/service/types/datastories/filters";
import {
  AdvancedFilterGroup,
  AdvancedFiltersSidebar,
} from "@/components/filters/AdvancedFiltersSidebar";
import {
  ToggleFilterSection,
  ToggleFilterSections,
} from "@/components/filters/ToggleFilterSections";
import { toggleSelection } from "@/utils/filterUtils";

const daysAgo = (dateStr: string, days: number) =>
  (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24) <= days;

interface DataStoriesFiltersProps {
  stories: Datastories;
  onFiltersChange: (state: DataStoriesFilterState) => void;
  onClearSearch: () => void;
}

export function DataStoriesFilters({
  stories,
  onFiltersChange,
  onClearSearch,
}: DataStoriesFiltersProps) {
  const safeStories = Array.isArray(stories) ? stories : [];
  const [selectedToggleFilters, setSelectedToggleFilters] = useState<DataStoriesToggleState>({
    temas: "all",
    atualizacao: "all",
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterTagOptions, setFilterTagOptions] = useState<{ id: string; name: string }[]>([]);
  const [filterSearchQueries, setFilterSearchQueries] = useState<Record<string, string>>({});

  useEffect(() => {
    onFiltersChange({
      toggles: selectedToggleFilters,
      tags: selectedTags,
    });
  }, [onFiltersChange, selectedTags, selectedToggleFilters]);

  const handleTagSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setFilterTagOptions([]);
      return;
    }
    try {
      const results = await suggestTags(query);
      setFilterTagOptions(results.map((tag) => ({ id: tag.text, name: tag.text })));
    } catch {
      setFilterTagOptions([]);
    }
  }, []);

  const handleToggleFilterChange = useCallback((filterKey: string, optionId: string) => {
    setSelectedToggleFilters((prev) => ({
      ...prev,
      [filterKey]: prev[filterKey as keyof DataStoriesToggleState] === optionId ? "all" : optionId,
    }));
  }, []);

  const handleAdvancedFilterChange = useCallback((paramName: string, value: string) => {
    if (paramName === "tag") {
      setSelectedTags((prev) => toggleSelection(prev, value));
    }
  }, []);

  const handleClearAdvancedFilter = useCallback((paramName: string) => {
    if (paramName === "tag") {
      setSelectedTags([]);
    }
  }, []);

  const handleFilterSearchChange = useCallback(
    (groupName: string, value: string) => {
      setFilterSearchQueries((prev) => ({ ...prev, [groupName]: value }));
      if (groupName === "Palavras-chave") {
        handleTagSearch(value);
      }
    },
    [handleTagSearch]
  );

  const getActiveValues = useCallback(
    (paramName: string) => {
      if (paramName === "tag") return selectedTags;
      return [];
    },
    [selectedTags]
  );

  const atualizacaoOptions = useMemo(
    () => [
      {
        id: "all",
        label: "Todos",
        count: String(safeStories.length),
      },
      {
        id: "30_days",
        label: "Os últimos 30 dias",
        count: String(safeStories.filter((story) => daysAgo(story.createdAt, 30)).length),
      },
      {
        id: "12_months",
        label: "Os últimos 12 meses",
        count: String(safeStories.filter((story) => daysAgo(story.createdAt, 365)).length),
      },
      {
        id: "3_years",
        label: "Os últimos 3 anos",
        count: String(safeStories.filter((story) => daysAgo(story.createdAt, 365 * 3)).length),
      },
    ],
    [safeStories]
  );

  const toggleSections = useMemo<ToggleFilterSection[]>(
    () => [
      {
        key: "temas",
        title: "Temas",
        options: [
          { id: "all", label: "Todos", count: safeStories.length },
          ...safeStories.reduce(
            (acc, story) => {
              if (!acc.some((option) => option.id === story.theme)) {
                acc.push({
                  id: story.theme,
                  label: story.organizationName,
                  count: String(safeStories.filter((entry) => entry.theme === story.theme).length),
                });
              }
              return acc;
            },
            [] as { id: string; label: string; count: string }[]
          ),
        ],
      },
      {
        key: "atualizacao",
        title: "Data da atualização",
        options: atualizacaoOptions.map((option) => ({
          id: option.id,
          label: option.label,
          count: option.count,
        })),
      },
    ],
    [atualizacaoOptions, safeStories]
  );

  const advancedFilterGroups = useMemo<AdvancedFilterGroup[]>(
    () => [
      {
        name: "Palavras-chave",
        param: "tag",
        data: filterTagOptions,
        searchable: true,
        suggest: true,
        searchPlaceholder: "Escreva para pesquisar...",
        minCharsMessage: "Escreva pelo menos 2 caracteres...",
        emptyMessage: "Sem resultados",
      },
    ],
    [filterTagOptions]
  );

  return (
    <div className="col-span-4">
      <ToggleFilterSections
        sections={toggleSections}
        selectedValues={selectedToggleFilters}
        onChange={handleToggleFilterChange}
        idPrefix="datastory-filter"
      />
      {/*
      <h2 className="font-bold text-xl text-neutral-900 mt-[36px] mb-32">
        Filtros avançados
      </h2>

      <AdvancedFiltersSidebar
        groups={advancedFilterGroups}
        searchQueries={filterSearchQueries}
        getActiveValues={getActiveValues}
        onToggleValue={handleAdvancedFilterChange}
        onSearchChange={handleFilterSearchChange}
        onClearGroup={handleClearAdvancedFilter}
        showClearActions={true}
        checkboxIdPrefix="datastory"
      />
      */}
      <div className="mt-32 mb-64">
        <Button
          variant="primary"
          appearance="outline"
          onClick={() => {
            setSelectedToggleFilters({ temas: "all", atualizacao: "all" });
            setSelectedTags([]);
            onClearSearch();
          }}
        >
          Limpar filtros
        </Button>
      </div>
    </div>
  );
}
