"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@ama-pt/agora-design-system";
import { fetchOrganizations } from "@/service/api/organizations";
import { Organization } from "@/service/types/identity";
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
  uniqueStrings,
  writeQueryParamValues,
} from "@/utils/filterUtils";

type ToggleFilterKey = "atualizacao" | "organizacao" | "acesso";

// The query-string param each toggle filter drives (kept out of the translated
// label build so the filter logic stays language-independent).
const TOGGLE_FILTER_PARAMS: Record<ToggleFilterKey, string> = {
  atualizacao: "modified_since",
  organizacao: "organization_badge",
  acesso: "access_type",
};

const DATE_RANGE_MAP: Record<string, () => string> = {
  "30_days": () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  },
  "12_months": () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  },
  "3_years": () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 3);
    return d.toISOString().slice(0, 10);
  },
};

function detectAtualizacaoFromParams(params: URLSearchParams): string {
  const since = params.get("modified_since");
  if (!since) return "all";
  if (since === DATE_RANGE_MAP["30_days"]()) return "30_days";
  if (since === DATE_RANGE_MAP["12_months"]()) return "12_months";
  if (since === DATE_RANGE_MAP["3_years"]()) return "3_years";
  return "all";
}

export const DataservicesFilters = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const paramsRef = useRef(queryString);
  const { t } = useTranslation("common");
  const { t: tDs } = useTranslation("dataservices");

  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});

  useEffect(() => {
    paramsRef.current = queryString;
  }, [queryString]);

  useEffect(() => {
    let active = true;
    fetchOrganizations(1, 100, { sort: "-datasets" })
      .then((res) => {
        if (active) setAllOrganizations(res.data);
      })
      .catch(() => {
        if (active) setAllOrganizations([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedToggleFilters = useMemo<Record<ToggleFilterKey, string>>(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    return {
      atualizacao: detectAtualizacaoFromParams(params),
      organizacao: params.get("organization_badge") || "all",
      acesso: params.get("access_type") || "all",
    };
  }, [searchParams]);

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

  const handleToggleFilterChange = useCallback(
    (filterKey: ToggleFilterKey, optionId: string) => {
      const current = getWorkingParams();

      if (filterKey === "atualizacao") {
        current.delete("modified_since");
        if (optionId !== "all" && DATE_RANGE_MAP[optionId]) {
          current.set("modified_since", DATE_RANGE_MAP[optionId]());
        }
      } else {
        current.delete(TOGGLE_FILTER_PARAMS[filterKey]);
        if (optionId !== "all") {
          current.set(TOGGLE_FILTER_PARAMS[filterKey], optionId);
        }
      }

      navigateWithParams(current);
    },
    [getWorkingParams, navigateWithParams]
  );

  const handleFilterChange = useCallback(
    (paramName: string, value: string) => {
      const current = getWorkingParams();
      const currentValues = readQueryParamValues(current, paramName);
      const nextValues = uniqueStrings(toggleSelection(currentValues, value));
      writeQueryParamValues(current, paramName, nextValues);
      navigateWithParams(current);
    },
    [getWorkingParams, navigateWithParams]
  );

  const handleSearchChange = useCallback((paramName: string, value: string) => {
    setSearchQueries((prev) => ({ ...prev, [paramName]: value }));
  }, []);

  const getActiveValues = useCallback(
    (paramName: string) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      return readQueryParamValues(current, paramName);
    },
    [searchParams]
  );

  const toggleSections = useMemo<ToggleFilterSection[]>(
    () => [
      {
        key: "atualizacao",
        title: t("filters.update.label"),
        options: [
          { id: "all", label: t("filters.all") },
          { id: "30_days", label: t("filters.update.options.30_days") },
          { id: "12_months", label: t("filters.update.options.12_months") },
          { id: "3_years", label: t("filters.update.options.3_years") },
        ],
      },
      {
        key: "organizacao",
        title: tDs("filters.orgType.title"),
        options: [
          { id: "all", label: t("filters.all") },
          { id: "public-service", label: tDs("filters.orgType.publicService") },
        ],
      },
      {
        key: "acesso",
        title: tDs("filters.accessType.title"),
        options: [
          { id: "all", label: t("filters.all") },
          { id: "open", label: tDs("filters.accessType.open") },
          { id: "open_with_account", label: tDs("filters.accessType.openWithAccount") },
          { id: "restricted", label: tDs("filters.accessType.restricted") },
        ],
      },
    ],
    [t, tDs]
  );

  const advancedFilterGroups = useMemo<AdvancedFilterGroup[]>(
    () => [
      {
        name: t("filters.advanced.organization"),
        param: "organization",
        data: allOrganizations.map((organization) => ({
          id: organization.id,
          name: organization.name,
        })),
        searchable: true,
      },
    ],
    [allOrganizations, t]
  );

  return (
    <div className="h-full">
      <ToggleFilterSections
        sections={toggleSections}
        selectedValues={selectedToggleFilters}
        onChange={(sectionKey, optionId) =>
          handleToggleFilterChange(sectionKey as ToggleFilterKey, optionId)
        }
        idPrefix="dsvc-filter"
      />

      <h2 className="font-bold text-xl text-neutral-900 mt-[36px] mb-32">
        {t("filters.advanced.label")}
      </h2>

      <AdvancedFiltersSidebar
        groups={advancedFilterGroups}
        searchQueries={searchQueries}
        getActiveValues={getActiveValues}
        onToggleValue={handleFilterChange}
        onSearchChange={handleSearchChange}
        checkboxIdPrefix="dataservice"
      />

      <div className="mt-32">
        <Button
          variant="primary"
          appearance="outline"
          onClick={() => {
            paramsRef.current = "";
            router.replace("/dataservices", { scroll: false });
          }}
        >
          {t("filters.clear")}
        </Button>
      </div>
    </div>
  );
};
