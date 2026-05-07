"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@ama-pt/agora-design-system";
import { OrgBadges, Organization } from "@/types/api";
import {
  AdvancedFilterGroup,
  AdvancedFiltersSidebar,
} from "@/components/filters/AdvancedFiltersSidebar";
import {
  ToggleFilterSection,
  ToggleFilterSections,
} from "@/components/filters/ToggleFilterSections";
import {
  readQueryParamValues,
  toggleSelection,
  writeQueryParamValues,
} from "@/utils/filterUtils";

const ORG_TYPE_OPTIONS = [
  { id: "all", label: "Todos", badge: "" },
  { id: "public-service", label: "Serviço público", badge: "public-service" },
  { id: "local-authority", label: "Autoridade local", badge: "local-authority" },
  { id: "company", label: "Empresas", badge: "company" },
  { id: "association", label: "Associação", badge: "association" },
];

const BADGE_LABELS_PT: Record<string, string> = {
  association: "Associação",
  certified: "Certificado",
  company: "Empresa",
  "local-authority": "Autoridade Local",
  "public-service": "Serviço Público",
};

interface OrganizationsFiltersProps {
  orgBadges: OrgBadges;
  orgBadgeCounts?: Record<string, number>;
  allOrganizations?: Organization[];
}

export const OrganizationsFilters = ({
  orgBadges,
  orgBadgeCounts = {},
  allOrganizations = [],
}: OrganizationsFiltersProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const paramsRef = useRef(queryString);
  const [badgeSearch, setBadgeSearch] = useState("");
  const [orgSearch, setOrgSearch] = useState("");

  const activeBadges = searchParams.getAll("badge");
  const activeOrgs = searchParams.getAll("organization");
  const selectedOrgType = activeBadges.length === 1 ? activeBadges[0] : "all";

  const totalOrgs = Object.values(orgBadgeCounts).reduce((sum, count) => sum + count, 0);

  const getWorkingParams = useCallback(() => new URLSearchParams(paramsRef.current), []);

  const navigateWithParams = useCallback(
    (params: URLSearchParams) => {
      params.set("page", "1");
      const search = params.toString();
      paramsRef.current = search;
      router.replace(`${pathname}${search ? `?${search}` : ""}`, { scroll: false });
    },
    [pathname, router]
  );

  useEffect(() => {
    paramsRef.current = queryString;
  }, [queryString]);

  const updateFilters = useCallback(
    (updates: { badges?: string[]; orgs?: string[] }) => {
      const newParams = getWorkingParams();
      const currentBadges = newParams.getAll("badge");
      const currentOrgs = newParams.getAll("organization");
      const badges = updates.badges ?? currentBadges;
      const orgs = updates.orgs ?? currentOrgs;

      writeQueryParamValues(newParams, "badge", badges);
      writeQueryParamValues(newParams, "organization", orgs);
      navigateWithParams(newParams);
    },
    [getWorkingParams, navigateWithParams]
  );

  const handleOrgTypeChange = useCallback(
    (optionId: string) => {
      updateFilters({ badges: optionId === "all" ? [] : [optionId] });
    },
    [updateFilters]
  );

  const toggleBadge = useCallback(
    (kind: string) => {
      const params = getWorkingParams();
      const currentBadges = readQueryParamValues(params, "badge");
      const next = toggleSelection(currentBadges, kind);
      updateFilters({ badges: next });
    },
    [getWorkingParams, updateFilters]
  );

  const toggleOrg = useCallback(
    (id: string) => {
      const params = getWorkingParams();
      const currentOrgs = readQueryParamValues(params, "organization");
      const next = toggleSelection(currentOrgs, id);
      updateFilters({ orgs: next });
    },
    [getWorkingParams, updateFilters]
  );

  const badgeEntries = useMemo(
    () =>
      Object.keys(orgBadges).map((kind) => ({
        id: kind,
        label: BADGE_LABELS_PT[kind] || orgBadges[kind],
        count: orgBadgeCounts[kind] ?? 0,
      })),
    [orgBadges, orgBadgeCounts]
  );

  const orgItems = useMemo(
    () => allOrganizations.map((organization) => ({ id: organization.id, name: organization.name })),
    [allOrganizations]
  );

  const selectedOrgItems = useMemo(
    () =>
      activeOrgs
        .filter((id) => !orgItems.some((org) => org.id === id))
        .map((id) => ({ id, name: id })),
    [activeOrgs, orgItems]
  );

  const allOrgItems = useMemo(
    () =>
      Array.from(
        new Map([...selectedOrgItems, ...orgItems].map((item) => [item.id, item])).values()
      ),
    [orgItems, selectedOrgItems]
  );

  const toggleSections = useMemo<ToggleFilterSection[]>(
    () => [
      {
        key: "orgType",
        title: "Tipo de organização",
        options: ORG_TYPE_OPTIONS.map((option) => ({
          id: option.id,
          label: option.label,
          count: option.id === "all" ? totalOrgs : orgBadgeCounts[option.badge] ?? 0,
        })),
      },
    ],
    [orgBadgeCounts, totalOrgs]
  );

  const advancedGroups = useMemo<AdvancedFilterGroup[]>(
    () => [
      {
        name: "Organizações",
        param: "organization",
        data: allOrgItems,
        searchable: true,
        searchPlaceholder: "Pesquisar",
        emptyMessage: "Nenhuma organização encontrada.",
      },
      {
        name: "Tipo de Organização",
        param: "badge",
        data: badgeEntries.map((entry) => ({
          id: entry.id,
          name: `${entry.label} (${entry.count.toLocaleString("pt-PT")})`,
        })),
        searchable: badgeEntries.length > 10,
        searchPlaceholder: "Pesquisar",
        emptyMessage: "Nenhum badge encontrado.",
      },
    ],
    [allOrgItems, badgeEntries]
  );

  const getActiveValues = useCallback(
    (paramName: string) => {
      if (paramName === "organization") return activeOrgs;
      if (paramName === "badge") return activeBadges;
      return [];
    },
    [activeBadges, activeOrgs]
  );

  const handleAdvancedToggle = useCallback(
    (paramName: string, value: string) => {
      if (paramName === "organization") toggleOrg(value);
      if (paramName === "badge") toggleBadge(value);
    },
    [toggleBadge, toggleOrg]
  );

  const handleGroupSearch = useCallback((groupName: string, value: string) => {
    if (groupName === "Organizações") setOrgSearch(value);
    if (groupName === "Tipo de Organização") setBadgeSearch(value);
  }, []);

  return (
    <div className="h-full organizations-filters">
      <ToggleFilterSections
        sections={toggleSections}
        selectedValues={{ orgType: selectedOrgType }}
        onChange={(_, optionId) => handleOrgTypeChange(optionId)}
        idPrefix="org-filter-type"
      />

      <h2 className="font-bold text-xl text-neutral-900 mt-64 mb-32">Filtros avançados</h2>

      <AdvancedFiltersSidebar
        groups={advancedGroups}
        searchQueries={{
          Organizações: orgSearch,
          "Tipo de Organização": badgeSearch,
        }}
        getActiveValues={getActiveValues}
        onToggleValue={handleAdvancedToggle}
        onSearchChange={handleGroupSearch}
        checkboxIdPrefix="organization-filter"
      />

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
