"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarItem,
  InputSearch,
  Icon,
  Pill,
  Toggle,
  Button,
  Checkbox,
} from "@ama-pt/agora-design-system";
import { fetchOrganizations } from "@/services/api";
import { OrgBadges, Organization, OrganizationFilters, SiteMetrics } from "@/types/api";

const ORG_TYPE_OPTIONS = [
  { id: "all", label: "Todos", badge: "" },
  { id: "public-service", label: "Serviço público", badge: "public-service" },
  { id: "local-authority", label: "Autoridade local", badge: "local-authority" },
  { id: "company", label: "Empresas", badge: "company" },
  { id: "association", label: "Associação", badge: "association" },
];

function toArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

interface OrganizationsFiltersProps {
  siteMetrics: SiteMetrics;
  orgBadges: OrgBadges;
  orgBadgeCounts?: Record<string, number>;
  initialFilters: OrganizationFilters;
  allOrganizations?: Organization[];
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
  orgBadgeCounts = {},
  initialFilters,
  allOrganizations = [],
}: OrganizationsFiltersProps) => {
  const router = useRouter();
  const [badgeSearch, setBadgeSearch] = React.useState("");
  const [orgSearch, setOrgSearch] = React.useState("");
  const [resolvedOrgBadgeCounts, setResolvedOrgBadgeCounts] =
    React.useState<Record<string, number>>(orgBadgeCounts);
  const [resolvedOrganizations, setResolvedOrganizations] =
    React.useState<Organization[]>(allOrganizations);

  const activeBadges = toArray(initialFilters.badge);
  const activeOrgs = toArray(initialFilters.organization);
  const selectedOrgType = activeBadges.length === 1 ? activeBadges[0] : "all";

  React.useEffect(() => {
    setResolvedOrgBadgeCounts(orgBadgeCounts);
  }, [orgBadgeCounts]);

  React.useEffect(() => {
    setResolvedOrganizations(allOrganizations);
  }, [allOrganizations]);

  const badgeKeys = React.useMemo(() => Object.keys(orgBadges), [orgBadges]);
  const resolvedCountsSize = Object.keys(resolvedOrgBadgeCounts).length;

  React.useEffect(() => {
    if (resolvedOrganizations.length > 0) return;

    let cancelled = false;

    async function loadOrganizations() {
      try {
        const res = await fetchOrganizations(1, 500, { sort: "name" });
        if (!cancelled) setResolvedOrganizations(res.data);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load organizations filter list", error);
        }
      }
    }

    loadOrganizations();

    return () => {
      cancelled = true;
    };
  }, [resolvedOrganizations.length]);

  React.useEffect(() => {
    if (resolvedCountsSize > 0 || badgeKeys.length === 0) return;

    let cancelled = false;

    async function loadBadgeCounts() {
      try {
        const results = await Promise.all(
          badgeKeys.map((badge) => fetchOrganizations(1, 1, { badge }))
        );
        if (cancelled) return;

        const counts = Object.fromEntries(
          badgeKeys.map((kind, i) => [kind, results[i].total])
        ) as Record<string, number>;
        setResolvedOrgBadgeCounts(counts);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load organizations badge counts", error);
        }
      }
    }

    loadBadgeCounts();

    return () => {
      cancelled = true;
    };
  }, [badgeKeys, resolvedCountsSize]);

  const totalOrgs = Object.values(resolvedOrgBadgeCounts).reduce((sum, c) => sum + c, 0);

  const buildUrl = (updates: {
    badges?: string[];
    orgs?: string[];
  }) => {
    const newParams = new URLSearchParams();
    if (initialFilters.q) newParams.set("q", initialFilters.q);
    if (initialFilters.sort) newParams.set("sort", initialFilters.sort);
    const badges = updates.badges !== undefined ? updates.badges : activeBadges;
    const orgs = updates.orgs !== undefined ? updates.orgs : activeOrgs;
    badges.forEach((b) => newParams.append("badge", b));
    orgs.forEach((o) => newParams.append("organization", o));
    newParams.set("page", "1");
    const qs = newParams.toString();
    router.replace(`/pages/organizations${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const handleOrgTypeChange = (optionId: string) => {
    buildUrl({ badges: optionId === "all" ? [] : [optionId] });
  };

  const toggleBadge = (kind: string) => {
    const next = activeBadges.includes(kind)
      ? activeBadges.filter((b) => b !== kind)
      : [...activeBadges, kind];
    buildUrl({ badges: next });
  };

  const toggleOrg = (id: string) => {
    const next = activeOrgs.includes(id)
      ? activeOrgs.filter((o) => o !== id)
      : [...activeOrgs, id];
    buildUrl({ orgs: next });
  };

  const entries = Object.keys(orgBadges).map((kind) => ({
    kind,
    label: BADGE_LABELS_PT[kind] || orgBadges[kind],
    count: resolvedOrgBadgeCounts[kind] ?? 0,
  }));

  const filteredEntries = badgeSearch.trim()
    ? entries.filter((entry) => entry.label.toLowerCase().includes(badgeSearch.toLowerCase()))
    : entries;

  const orgItems = resolvedOrganizations.map((o) => ({ id: o.id, name: o.name }));
  const selectedOrgItems = activeOrgs
    .filter((id) => !orgItems.some((o) => o.id === id))
    .map((id) => ({ id, name: id }));
  const allOrgItems = [...selectedOrgItems, ...orgItems];
  const filteredOrgs = orgSearch.trim()
    ? allOrgItems.filter((o) => o.name.toLowerCase().includes(orgSearch.toLowerCase()))
    : allOrgItems;

  return (
    <div className="h-full organizations-filters">
      <div className="flex flex-col gap-32 mt-[36px] mb-[36px]">
        <h2 className="font-bold text-xl text-neutral-900">Filtros</h2>
        <div className="pr-32 max-w-[592px] flex flex-col gap-8">
          <h3 className="font-bold text-base text-neutral-900 mb-8">
            Tipo de organização
          </h3>
          {ORG_TYPE_OPTIONS.map((option) => {
            const isSelected = selectedOrgType === option.id;
            const count = option.id === "all"
              ? totalOrgs
              : (resolvedOrgBadgeCounts[option.badge] ?? 0);
            return (
              <Toggle
                key={option.id}
                id={`org-filter-type-${option.id}`}
                name="org-filter-type"
                value={option.id}
                appearance="icon"
                variant="primary"
                checked={isSelected}
                onChange={() => handleOrgTypeChange(option.id)}
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
                    {count.toLocaleString("pt-PT")}
                  </Pill>
                </div>
              </Toggle>
            );
          })}
        </div>
      </div>

      <h2 className="font-bold text-xl text-neutral-900 mt-64 mb-32">Filtros avançados</h2>

      <Sidebar variant="filter" className="font-bold">
        <SidebarItem
          variant="filter"
          item={{
            children: <span className="font-bold">Organizações</span>,
            hasIcon: true,
            collapsedIconTrailing: "agora-line-minus-circle",
            collapsedIconHoverTrailing: "agora-solid-minus-circle",
            expandedIconTrailing: "agora-line-plus-circle",
            expandedIconHoverTrailing: "agora-solid-plus-circle",
          }}
          hasPill={activeOrgs.length > 0}
          pillValue={activeOrgs.length}
        >
          <div className="mt-16">
            <div className="mb-4 mt-8 relative">
              <InputSearch
                label="Pesquisar organização"
                hideLabel
                placeholder="Pesquisar"
                value={orgSearch}
                onChange={(e) => setOrgSearch(e.target.value)}
              />
              <Icon
                name="agora-solid-search"
                className="absolute right-12 top-1/2 transform -translate-y-1/2 text-primary-500 w-20 h-20 pointer-events-none"
                aria-hidden="true"
              />
            </div>
            <div
              className={`flex flex-col gap-2 mt-16 pb-16 ${filteredOrgs.length > 5 ? "max-h-[225px] overflow-y-auto" : ""}`}
            >
              {filteredOrgs.length > 0 ? (
                filteredOrgs.map((o) => (
                  <Checkbox
                    key={o.id}
                    label={o.name}
                    className="font-bold"
                    value={o.id}
                    name="organization"
                    checked={activeOrgs.includes(o.id)}
                    onChange={() => toggleOrg(o.id)}
                  />
                ))
              ) : (
                <span className="text-sm text-neutral-500">Nenhuma organização encontrada.</span>
              )}
            </div>
          </div>
        </SidebarItem>

        <SidebarItem
          variant="filter"
          item={{
            children: <span className="font-bold">Tipo de Organização</span>,
            hasIcon: true,
            collapsedIconTrailing: "agora-line-minus-circle",
            collapsedIconHoverTrailing: "agora-solid-minus-circle",
            expandedIconTrailing: "agora-line-plus-circle",
            expandedIconHoverTrailing: "agora-solid-plus-circle",
          }}
          hasPill={activeBadges.length > 0}
          pillValue={activeBadges.length}
        >
          <div className="mt-16">
            {entries.length > 10 && (
              <div className="mb-4 mt-8 relative">
                <InputSearch
                  label="Pesquisar badge"
                  hideLabel
                  placeholder="Pesquisar"
                  value={badgeSearch}
                  onChange={(e) => setBadgeSearch(e.target.value)}
                />
                <Icon
                  name="agora-solid-search"
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 text-primary-500 w-20 h-20 pointer-events-none"
                  aria-hidden="true"
                />
              </div>
            )}
            <div className="flex flex-col gap-2 mt-16 pb-16">
              {filteredEntries.map((entry) => (
                <Checkbox
                  key={entry.kind}
                  label={`${entry.label} (${entry.count.toLocaleString("pt-PT")})`}
                  className="font-bold"
                  value={entry.kind}
                  name="badge"
                  checked={activeBadges.includes(entry.kind)}
                  onChange={() => toggleBadge(entry.kind)}
                />
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
            router.replace("/pages/organizations", { scroll: false });
          }}
        >
          Limpar filtros
        </Button>
      </div>
    </div>
  );
};
