"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Sidebar, SidebarItem, InputSearch, Icon, Pill, Toggle, Button } from "@ama-pt/agora-design-system";
import { OrgBadges, OrganizationFilters, SiteMetrics } from "@/types/api";
import { CategoryToggles } from "@/components/CategoryToggles";

const ORG_TOGGLE_FILTERS = {
  organizacao: {
    title: "Tipo de organização",
    options: [
      { id: "all", label: "Todos", count: "352" },
      { id: "public_service", label: "Serviço público", count: "259" },
      { id: "local_authority", label: "Autoridade local", count: "54" },
      { id: "business", label: "Negócios", count: "8" },
      { id: "association", label: "Associação", count: "6" },
    ],
  },
};

type OrgFilterKey = keyof typeof ORG_TOGGLE_FILTERS;

interface OrganizationsFiltersProps {
  siteMetrics: SiteMetrics;
  orgBadges: OrgBadges;
  orgBadgeCounts: Record<string, number>;
  initialFilters: OrganizationFilters;
}

const BADGE_LABELS_PT: Record<string, string> = {
  association: "Associação",
  certified: "Certificado",
  company: "Empresa",
  "local-authority": "Autoridade Local",
  "public-service": "Serviço Público",
};

export const OrganizationsFilters = ({
  siteMetrics,
  orgBadges,
  orgBadgeCounts,
  initialFilters,
}: OrganizationsFiltersProps) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedToggleFilters, setSelectedToggleFilters] = React.useState<Record<OrgFilterKey, string>>({
    organizacao: "all",
  });

  const handleToggleFilterChange = (filterKey: OrgFilterKey, optionId: string) => {
    setSelectedToggleFilters((prev) => ({ ...prev, [filterKey]: optionId }));
  };

  const activeBadge = initialFilters.badge || "";

  const entries = Object.keys(orgBadges).map((kind) => ({
    kind,
    label: BADGE_LABELS_PT[kind] || orgBadges[kind],
    count: orgBadgeCounts[kind] ?? 0,
  }));

  const filteredEntries = searchQuery.trim()
    ? entries.filter((entry) => entry.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : entries;

  const handleBadgeClick = (kind: string) => {
    const newParams = new URLSearchParams();
    if (initialFilters.q) newParams.set("q", initialFilters.q);
    if (initialFilters.sort) newParams.set("sort", initialFilters.sort);
    if (activeBadge === kind) {
      newParams.delete("badge");
    } else {
      newParams.set("badge", kind);
    }
    newParams.set("page", "1");
    const qs = newParams.toString();
    router.replace(`/pages/organizations${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  return (
    <div className="h-full organizations-filters">
      <CategoryToggles siteMetrics={siteMetrics} searchQuery={initialFilters.q} exclude={["organizacoes"]} />

      <div className="flex flex-col gap-32 mt-[36px] mb-[36px]">
        <h2 className="font-bold text-xl text-neutral-900">Filtros</h2>
        {(Object.keys(ORG_TOGGLE_FILTERS) as OrgFilterKey[]).map((filterKey) => {
          const section = ORG_TOGGLE_FILTERS[filterKey];
          return (
            <div key={filterKey} className="pr-32 max-w-[592px] flex flex-col gap-8">
              <h3 className="font-bold text-base text-neutral-900 mb-8">
                {section.title}
              </h3>
              {section.options.map((option) => {
                const isSelected = selectedToggleFilters[filterKey] === option.id;
                return (
                  <Toggle
                    key={option.id}
                    id={`org-filter-${filterKey}-${option.id}`}
                    name={`org-filter-${filterKey}`}
                    value={option.id}
                    appearance="icon"
                    variant="primary"
                    checked={isSelected}
                    onChange={() => handleToggleFilterChange(filterKey, option.id)}
                    iconOnly={false}
                    fullWidth={true}
                    className="w-full"
                  >
                    <div className="flex items-center gap-12 font-bold text-sm">
                      <span
                        className={
                          isSelected
                            ? "text-primary-600 font-bold"
                            : "text-neutral-900 font-bold"
                        }
                      >
                        {option.label}
                      </span>
                      <Pill
                        variant="neutral"
                        appearance="outline"
                        circular={false}
                        className="text-xs font-medium text-neutral-500 ml-16"
                      >
                        {option.count}
                      </Pill>
                    </div>
                  </Toggle>
                );
              })}
            </div>
          );
        })}
      </div>

      <h2 className="font-bold text-xl text-neutral-900 mt-64 mb-32">Filtros avançados</h2>

      <Sidebar variant="filter" className="font-bold">
        <SidebarItem
          variant="filter"
          open={true}
          item={{
            children: <span className="font-bold">Tipo de Organização</span>,
            hasIcon: true,
            collapsedIconTrailing: "agora-line-minus-circle",
            collapsedIconHoverTrailing: "agora-solid-minus-circle",
            expandedIconTrailing: "agora-line-plus-circle",
            expandedIconHoverTrailing: "agora-solid-plus-circle",
          }}
        >
          <div className="mt-16">
            {entries.length > 10 && (
              <div className="mb-4 mt-8 relative">
                <InputSearch
                  label="Pesquisar badge"
                  hideLabel
                  placeholder="Pesquisar"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Icon
                  name="agora-solid-search"
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 text-primary-500 w-20 h-20 pointer-events-none"
                  aria-hidden="true"
                />
              </div>
            )}
            <div className="flex flex-col gap-8 mt-16 pb-16">
              {filteredEntries.map((entry) => (
                <button
                  key={entry.kind}
                  type="button"
                  onClick={() => handleBadgeClick(entry.kind)}
                  className={`flex items-center justify-between w-full px-12 py-8 rounded-8 text-sm transition-colors cursor-pointer ${
                    activeBadge === entry.kind
                      ? "bg-primary-100 text-primary-700 font-bold"
                      : "text-neutral-900 font-bold hover:bg-neutral-100"
                  }`}
                >
                  <span>{entry.label}</span>
                  <Pill
                    variant="neutral"
                    appearance="outline"
                    circular={false}
                    className="text-xs font-medium text-neutral-500 ml-8"
                  >
                    {entry.count.toLocaleString("pt-PT")}
                  </Pill>
                </button>
              ))}
              {filteredEntries.length === 0 && (
                <span className="text-sm text-neutral-500">Nenhum badge encontrado.</span>
              )}
            </div>
          </div>
        </SidebarItem>
      </Sidebar>

      <div className="mt-32">
        <Button
          variant="primary"
          appearance="outline"
          onClick={() => {
            setSelectedToggleFilters({ organizacao: "all" });
            router.replace("/pages/organizations", { scroll: false });
          }}
        >
          Limpar filtros
        </Button>
      </div>
    </div>
  );
};
