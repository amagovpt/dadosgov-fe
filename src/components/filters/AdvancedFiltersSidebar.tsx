"use client";

import { Sidebar, SidebarItem, Checkbox, InputSearch, Icon } from "@ama-pt/agora-design-system";

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
  return (
    <Sidebar variant="filter" className="font-bold">
      {groups.map((group) => {
        const searchQuery = searchQueries[group.name] || "";
        const activeValues = getActiveValues(group.param);
        const activeCount = activeValues.length;

        const selectedItems: AdvancedFilterOption[] = group.suggest
          ? activeValues
              .filter((value) => !group.data.some((item) => item.id === value))
              .map((value) => ({ id: value, name: value }))
          : [];

        const uniqueData = Array.from(
          new Map([...selectedItems, ...group.data].map((item) => [item.id, item])).values()
        );

        const normalize = (s: string) =>
          s
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .toLowerCase();
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
                  className="text-xs text-primary-500 hover:text-primary-700 underline mb-4 mt-4 cursor-pointer"
                >
                  Limpar {group.name.toLowerCase()}
                </button>
              )}
              {group.searchable && (
                <div className="mb-4 mt-8 relative">
                  <InputSearch
                    label="Pesquisar"
                    hideLabel
                    placeholder={group.searchPlaceholder || "Pesquisar"}
                    value={searchQuery}
                    onChange={(event) => onSearchChange(group.name, event.target.value)}
                  />
                  <Icon
                    name="agora-solid-search"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-primary-500 w-5 h-5 pointer-events-none"
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
                      {group.minCharsMessage || "Escreva pelo menos 2 caracteres..."}
                    </p>
                  )
                ) : (
                  <p className="text-sm text-neutral-500">
                    {group.emptyMessage || "Sem resultados"}
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
