"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@ama-pt/agora-design-system";
import { OrgBadges, Organization } from "@/service/types/identity";
import {
  AdvancedFilterGroup,
  AdvancedFiltersSidebar,
} from "@/components/filters/AdvancedFiltersSidebar";
import {
  ToggleFilterSection,
  ToggleFilterSections,
} from "@/components/filters/ToggleFilterSections";
import { readQueryParamValues, toggleSelection, writeQueryParamValues } from "@/utils/filterUtils";
import { useTranslation } from "react-i18next";

const ORG_TYPE_OPTIONS = [
  { id: "all", badge: "" },
  { id: "public-service", badge: "public-service" },
  { id: "local-authority", badge: "local-authority" },
  { id: "company", badge: "company" },
  { id: "association", badge: "association" },
];

// Maps an org-type option id to its label key in the `organizations` namespace.
const ORG_TYPE_OPTION_LABEL_KEYS: Record<string, string> = {
  "public-service": "filters.orgType.options.publicService",
  "local-authority": "filters.orgType.options.localAuthority",
  company: "filters.orgType.options.company",
  association: "filters.orgType.options.association",
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
  const { t, i18n } = useTranslation("common");
  const { t: tOrg } = useTranslation("organizations");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const paramsRef = useRef(queryString);
  const [badgeSearch, setBadgeSearch] = useState("");
  const [orgSearch, setOrgSearch] = useState("");

  // Display labels only. The sidebar identifies a group by its `param`, never by
  // its name — routing on the translated label is what broke the suggest
  // searches (LEDG-2326).
  const orgGroupName = t("filters.advanced.organization");
  const badgeGroupName = tOrg("filters.advanced.orgTypeGroup");

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
        label: tOrg(`filters.badges.${kind}`, { defaultValue: orgBadges[kind] }),
        count: orgBadgeCounts[kind] ?? 0,
      })),
    [orgBadges, orgBadgeCounts, tOrg]
  );

  const orgItems = useMemo(
    () =>
      allOrganizations.map((organization) => ({ id: organization.id, name: organization.name })),
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
        title: tOrg("filters.orgType.title"),
        options: ORG_TYPE_OPTIONS.map((option) => ({
          id: option.id,
          label:
            option.id === "all" ? t("filters.all") : tOrg(ORG_TYPE_OPTION_LABEL_KEYS[option.id]),
          count: option.id === "all" ? totalOrgs : (orgBadgeCounts[option.badge] ?? 0),
        })),
      },
    ],
    [orgBadgeCounts, totalOrgs, t, tOrg]
  );

  const advancedGroups = useMemo<AdvancedFilterGroup[]>(
    () => [
      {
        name: orgGroupName,
        param: "organization",
        data: allOrgItems,
        searchable: true,
        searchPlaceholder: t("search.label"),
        emptyMessage: tOrg("filters.advanced.orgsEmpty"),
      },
      {
        name: badgeGroupName,
        param: "badge",
        data: badgeEntries.map((entry) => ({
          id: entry.id,
          name: `${entry.label} (${entry.count.toLocaleString(i18n.language)})`,
        })),
        searchable: badgeEntries.length > 10,
        searchPlaceholder: t("search.label"),
        emptyMessage: tOrg("filters.advanced.badgeEmpty"),
      },
    ],
    [allOrgItems, badgeEntries, orgGroupName, badgeGroupName, t, tOrg]
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

  const handleGroupSearch = useCallback((paramName: string, value: string) => {
    if (paramName === "organization") setOrgSearch(value);
    if (paramName === "badge") setBadgeSearch(value);
  }, []);

  return (
    <div className="organizations-filters h-full">
      <ToggleFilterSections
        sections={toggleSections}
        selectedValues={{ orgType: selectedOrgType }}
        onChange={(_, optionId) => handleOrgTypeChange(optionId)}
        idPrefix="org-filter-type"
      />

      <h2 className="text-xl mb-32 mt-64 font-bold text-neutral-900">
        {t("filters.advanced.label")}
      </h2>

      <AdvancedFiltersSidebar
        groups={advancedGroups}
        searchQueries={{
          organization: orgSearch,
          badge: badgeSearch,
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
            router.replace("/organizations", { scroll: false });
          }}
        >
          {t("filters.clear")}
        </Button>
      </div>
    </div>
  );
};
