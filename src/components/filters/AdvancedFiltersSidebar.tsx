"use client";

import { Sidebar, SidebarItem, Checkbox, InputSearch, Icon } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";

export interface AdvancedFilterOption {
  id: string;
  name: string;
}

export interface AdvancedFilterGroup {
  name: string;
  param: string;
  data: AdvancedFilterOption[];
  searchable?: boolean;
  suggest?: boolean;
  searchPlaceholder?: string;
  minSearchChars?: number;
  minCharsMessage?: string;
  emptyMessage?: string;
  /**
   * True when the last suggestion request for this group failed. Kept separate
   * from an empty `data`, because "the search could not run" and "the search
   * found nothing" must not read the same to the user (LEDG-2326).
   */
  hasError?: boolean;
  /** Overrides the default error message, in the shape of `emptyMessage`. */
  errorMessage?: string;
  /**
   * Display labels for selected ids (`suggest` groups only). Lets a selected
   * item keep its human-readable name once it drops out of the live
   * suggestions list (e.g. after clearing the search input).
   */
  selectedLabels?: Record<string, string>;
}

interface AdvancedFiltersSidebarProps {
  groups: AdvancedFilterGroup[];
  searchQueries: Record<string, string>;
  getActiveValues: (paramName: string) => string[];
  onToggleValue: (paramName: string, value: string) => void;
  onSearchChange: (groupName: string, value: string) => void;
  onClearGroup?: (paramName: string) => void;
  showClearActions?: boolean;
  checkboxIdPrefix: string;
  isLoading?: boolean;
}

export function AdvancedFiltersSidebar({
  groups,
  searchQueries,
  getActiveValues,
  onToggleValue,
  onSearchChange,
  onClearGroup,
  showClearActions = false,
  checkboxIdPrefix,
  isLoading = false,
}: AdvancedFiltersSidebarProps) {
  const { t } = useTranslation("common");

  return (
    <Sidebar variant="filter" className="font-bold">
      {groups.map((group) => {
        const searchQuery = searchQueries[group.name] || "";
        const activeValues = getActiveValues(group.param);
        const activeCount = activeValues.length;

        const selectedItems: AdvancedFilterOption[] = group.suggest
          ? activeValues
              .filter((value) => !group.data.some((item) => item.id === value))
              .map((value) => ({ id: value, name: group.selectedLabels?.[value] ?? value }))
          : [];

        const uniqueData = Array.from(
          new Map([...selectedItems, ...group.data].map((item) => [item.id, item])).values()
        );

        const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
        const filteredData = group.suggest
          ? uniqueData
          : uniqueData.filter((item) => normalize(item.name).includes(normalize(searchQuery)));
        const showScroll = filteredData.length > 5;
        const minSearchChars = group.minSearchChars ?? 2;

        return (
          <SidebarItem
            key={`${group.param}-${group.name}`}
            variant="filter"
            item={{
              children: <span className="font-bold">{group.name}</span>,
              hasIcon: true,
              collapsedIconTrailing: "agora-line-minus-circle",
              collapsedIconHoverTrailing: "agora-solid-minus-circle",
              expandedIconTrailing: "agora-line-plus-circle",
              expandedIconHoverTrailing: "agora-solid-plus-circle",
            }}
            hasPill={activeCount > 0}
            pillValue={activeCount}
          >
            <div>
              {showClearActions && onClearGroup && activeCount > 0 && (
                <button
                  onClick={() => onClearGroup(group.param)}
                  className="text-xs mb-4 mt-4 cursor-pointer text-primary-500 underline hover:text-primary-700"
                >
                  Limpar {group.name.toLowerCase()}
                </button>
              )}
              {group.searchable && (
                <div className="relative mb-4 mt-8">
                  <InputSearch
                    label={t("search.label")}
                    hideLabel
                    placeholder={group.searchPlaceholder || t("search.placeholder")}
                    value={searchQuery}
                    onChange={(event) => onSearchChange(group.name, event.target.value)}
                  />
                  <Icon
                    name="agora-solid-search"
                    className="w-5 h-5 pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 transform text-primary-500"
                    aria-hidden="true"
                  />
                </div>
              )}
              <div
                className={`flex flex-col gap-2 ${showScroll ? "max-h-[225px] overflow-y-auto" : ""}`}
              >
                {isLoading && !group.suggest ? null : filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <Checkbox
                      key={item.id}
                      id={`${checkboxIdPrefix}-${group.param}-${encodeURIComponent(item.id)}`}
                      label={item.name}
                      className="font-bold"
                      value={item.id}
                      name={group.param}
                      checked={activeValues.includes(item.id)}
                      onChange={() => onToggleValue(group.param, item.id)}
                    />
                  ))
                ) : group.suggest && searchQuery.length < minSearchChars ? (
                  activeCount > 0 ? null : (
                    <p className="text-sm text-neutral-900">
                      {group.minCharsMessage || t("search.minCharsMessage")}
                    </p>
                  )
                ) : group.hasError ? (
                  <div className="flex flex-col items-start gap-2">
                    <p className="text-sm text-danger-700" role="status">
                      {group.errorMessage || t("search.error")}
                    </p>
                    <button
                      type="button"
                      onClick={() => onSearchChange(group.name, searchQuery)}
                      className="text-xs cursor-pointer text-primary-500 underline hover:text-primary-700"
                    >
                      {t("search.retry")}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">
                    {group.emptyMessage || t("search.noResults")}
                  </p>
                )}
              </div>
            </div>
          </SidebarItem>
        );
      })}
    </Sidebar>
  );
}
