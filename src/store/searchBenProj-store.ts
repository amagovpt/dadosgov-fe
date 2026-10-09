import { RangedNumberFilter } from "@/components/Shared/SearchBeneficiariesAndProjects/filters/constants";
import { useTranslation } from "react-i18next";
import { createStore } from "zustand/vanilla";
import ExcelJS from "exceljs";
import { flattenData } from "@/utils/flattenObject";
import { EntityRole } from "@/service/types/datastories/pesquisar-beneficiarios";

// ----------------------------------------------------------------------------------------------------

const LIMIT = 10;

const BENEFICIARIES_TYPES = {
  mainBeneficiaries: EntityRole.BENEFICIARIO_PRINCIPAL,
  otherBeneficiaries: EntityRole.OUTROS_BENEFICIARIOS,
};

// ----------------------------------------------------------------------------------------------------

function prepareRangedFilterNames(): string[] {
  const res: string[] = [];
  RangedNumberFilter.forEach((rf) => {
    res.push(`${rf}Min`);
    res.push(`${rf}Max`);
  });
  return res;
}

// ----------------------------------------------------------------------------------------------------

const RANGED_FILTERS = prepareRangedFilterNames();

// ----------------------------------------------------------------------------------------------------

export type RangedFiltersDetails = {
  approvedValueMax: number;
  approvedValueMin: number;
  executedValueMax: number;
  executedValueMin: number;
  paidValueMax: number;
  paidValueMin: number;
  projectsAmountMax: number;
  projectsAmountMin: number;
};

export type FilterValue = string | number | readonly string[] | boolean;

export type Filters = {
  [filter: string]: FilterValue;
};

export type SearchBenProjStoreStates = {
  subject: "beneficiaries" | "projects";
  apiRoute: string;
  searchBy: string;
  indicator: string;
  filters: Filters;
  appliedFilters: Filters;
  sortBy: string;
  loading: boolean;
  page: number;
  nPages: number;
  data: Record<string, string | number | object>[];
  total: number;
  totalFiltered: number;
  showFilters: Array<[string, FilterValue]>;
  rangedFiltersDetails: RangedFiltersDetails;
};

export type SearchBenProjStoreActions = {
  initFromURL: (t: ReturnType<typeof useTranslation>["t"], locale: string) => void;
  setSearchBy: (searchBy: string) => void;
  setIndicator: (indicator: string) => void;
  addFilter: (
    filter: string,
    value: FilterValue,
    t: ReturnType<typeof useTranslation>["t"],
    locale: string,
    isMobile?: boolean
  ) => void;
  applyFilter: (filter: string, t: ReturnType<typeof useTranslation>["t"], locale: string) => void;
  applyFilters: (t: ReturnType<typeof useTranslation>["t"], locale: string) => void;
  removeFilter: (filter: string, t: ReturnType<typeof useTranslation>["t"], locale: string) => void;
  reset: (t: ReturnType<typeof useTranslation>["t"], locale: string) => void;
  setSortBy: (sortBy: string) => void;
  setPage: (page: number) => void;
  search: () => Promise<void>;
  downloadList: (
    filename: string,
    pathnameArray: string[],
    source: string,
    update: string,
    t: ReturnType<typeof useTranslation>["t"]
  ) => Promise<void>;
};

export type SearchBenProjStore = SearchBenProjStoreStates & SearchBenProjStoreActions;

// ----------------------------------------------------------------------------------------------------

const getDefaultFilters = (subject: "beneficiaries" | "projects"): Filters => {
  if (subject === "projects") {
    return {};
  }

  return {
    mainBeneficiaries: true,
    otherBeneficiaries: true,
  };
};

const createInitialState = (
  subject: "beneficiaries" | "projects",
  apiRoute: string
): SearchBenProjStoreStates => {
  const filters = getDefaultFilters(subject);

  return {
    subject: subject,
    apiRoute: apiRoute,
    searchBy: "name",
    indicator: "financed",
    filters: filters,
    appliedFilters: filters,
    sortBy: "amountDesc",
    loading: true,
    page: 1,
    nPages: 0,
    total: 0,
    totalFiltered: 0,
    data: [],
    showFilters: [],
    rangedFiltersDetails: {
      approvedValueMax: 999999999999,
      approvedValueMin: 0,
      executedValueMax: 999999999999,
      executedValueMin: 0,
      paidValueMax: 999999999999,
      paidValueMin: 0,
      projectsAmountMax: 999999999999,
      projectsAmountMin: 0,
    },
  };
};

// ----------------------------------------------------------------------------------------------------

export const createSearchBenProjStore = (
  subject: "beneficiaries" | "projects" = "beneficiaries",
  apiRoute: string
) => {
  const initialState = createInitialState(subject, apiRoute);

  const prepareShowFilters = (
    filters: Filters,
    subject: "beneficiaries" | "projects",
    t: ReturnType<typeof useTranslation>["t"],
    locale: string
  ) => {
    const defaultFilters = getDefaultFilters(subject);

    const res: Array<[string, FilterValue]> = [];

    // most filters
    Object.entries(filters).forEach(([key, value]) => {
      if (key in defaultFilters) return;
      if (RangedNumberFilter.some((rf) => key === `${rf}Min` || key === `${rf}Max`)) return;
      if (value === undefined || value === "" || value === null || value === false) return;
      res.push([key, value]);
    });

    // handle ranged filters (merge min/max into a single filter to show, when both have values)
    RangedNumberFilter.forEach((rf) => {
      const minKey = `${rf}Min`;
      const maxKey = `${rf}Max`;
      const minVal = filters[minKey];
      const maxVal = filters[maxKey];

      const hasMin = minVal !== undefined && minVal !== "" && minVal !== null;
      const hasMax = maxVal !== undefined && maxVal !== "" && maxVal !== null;

      if (hasMin && hasMax) {
        const from = Number(minVal).toLocaleString(locale);
        const to = Number(maxVal).toLocaleString(locale);
        res.push([
          rf,
          t(`searchBenProj.filters.${rf}.fromTo`, {
            min: from,
            max: to,
          }),
        ]);
      } else if (hasMin) {
        const from = Number(minVal).toLocaleString(locale);
        res.push([
          minKey,
          t(`searchBenProj.filters.${rf}.from`, {
            min: from,
          }),
        ]);
      } else if (hasMax) {
        const to = Number(maxVal).toLocaleString(locale);
        res.push([
          maxKey,
          t(`searchBenProj.filters.${rf}.to`, {
            max: to,
          }),
        ]);
      }
    });

    return res;
  };

  return createStore<SearchBenProjStore>()((set, get) => ({
    // state

    ...initialState,
    showFilters: [], // will be set in initFromURL

    // actions

    initFromURL: (t, locale) => {
      if (typeof window === "undefined") return;

      const params = new URLSearchParams(window.location.search);

      const searchBy = params.get("searchBy") ?? initialState.searchBy;
      const indicator = params.get("indicator") ?? initialState.indicator;
      const sortBy = params.get("sortBy") ?? initialState.sortBy;

      const filters: Filters = { ...initialState.filters };
      params.forEach((value, key) => {
        if (!["searchBy", "indicator", "sortBy", "page"].includes(key)) {
          if (["mainBeneficiaries", "otherBeneficiaries", "supliers"].includes(key)) {
            filters[key] = value === "true";
          } else {
            filters[key] = value;
          }
        }
      });

      const appliedFilters = { ...filters };

      set({
        searchBy,
        indicator,
        sortBy,
        filters,
        appliedFilters,
        showFilters: prepareShowFilters(appliedFilters, subject, t, locale),
      });

      get().search();
    },

    setSearchBy: (searchBy) => set({ searchBy }),

    setIndicator: (indicator) => {
      set({ indicator, page: 1 });
      get().search();
    },

    addFilter: (filter, value, t, locale, isMobile = false) => {
      set((state) => {
        if (value && value !== "") {
          const filters = { ...state.filters, [filter]: value };
          return {
            filters,
          };
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [filter]: filterToRemove, ...filters } = state.filters;
          return {
            filters,
            showFilters: prepareShowFilters(state.appliedFilters, subject, t, locale),
          };
        }
      });
      if (!isMobile && !RANGED_FILTERS.includes(filter) && filter !== "query") {
        get().applyFilter(filter, t, locale);
      }
    },

    applyFilter: (filter, t, locale) => {
      set((state) => {
        const appliedFilters = {
          ...state.appliedFilters,
          [filter]: state.filters[filter],
        };
        return {
          appliedFilters,
          showFilters: prepareShowFilters(appliedFilters, subject, t, locale),
        };
      });
      get().search();
    },

    applyFilters: (t, locale) => {
      set((state) => {
        const appliedFilters = { ...state.filters };
        return {
          appliedFilters,
          showFilters: prepareShowFilters(appliedFilters, subject, t, locale),
        };
      });
      get().search();
    },

    removeFilter: (filter, t, locale) => {
      set((state) => {
        if (RangedNumberFilter.includes(filter as (typeof RangedNumberFilter)[number])) {
          const minKey = `${filter}Min`;
          const maxKey = `${filter}Max`;
          const {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            [minKey]: minToRemove,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            [maxKey]: maxToRemove,
            ...filters
          } = state.filters;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            [minKey]: minAppliedToRemove,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            [maxKey]: maxAppliedToRemove,
            ...appliedFilters
          } = state.appliedFilters;
          return {
            filters,
            appliedFilters,
            showFilters: prepareShowFilters(appliedFilters, subject, t, locale),
          };
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [filter]: filterToRemove, ...filters } = state.filters;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [filter]: appliedFilterToRemove, ...appliedFilters } = state.appliedFilters;
        return {
          filters,
          appliedFilters,
          showFilters: prepareShowFilters(appliedFilters, subject, t, locale),
        };
      });
      get().search();
    },

    reset: (t, locale) => {
      const resetState = createInitialState(subject, apiRoute);
      set({
        ...resetState,
        showFilters: prepareShowFilters(resetState.filters, subject, t, locale),
      });
      get().search();
    },

    setSortBy: (sortBy) => {
      set({ sortBy, page: 1 });
      get().search();
    },

    setPage: (page) => {
      set({ page: Math.max(1, page) });
      get().search();
    },

    search: async () => {
      const state = get();
      const params = new URLSearchParams();

      params.set("searchBy", state.searchBy);
      params.set("indicator", state.indicator);
      params.set("sortBy", state.sortBy);

      Object.entries(state.appliedFilters).forEach(([key, value]) => {
        params.set(key, String(value));
      });

      // update url query params
      if (typeof window !== "undefined") {
        window.history.pushState(null, "", `?${params.toString()}`);
      }

      set({ loading: true });

      try {
        let bodyData: Record<string, FilterValue> = {
          limit: LIMIT,
          page: state.page,
        };

        // add sortBy and sortOrder based on state.sortBy
        let apiSortBy: string = "";
        let apiSortOrder: string = "DESC";
        if (state.sortBy.startsWith("amount")) {
          apiSortBy =
            state.indicator === "financed"
              ? "APPROVED_VALUE"
              : state.indicator === "executed"
                ? "EXECUTED_VALUE"
                : "PAID_VALUE";
          apiSortOrder = state.sortBy.endsWith("Asc") ? "ASC" : "DESC";
        } else if (state.sortBy.startsWith("projects")) {
          apiSortBy = "PROJECTS_AMOUNT";
          apiSortOrder = state.sortBy.endsWith("Asc") ? "ASC" : "DESC";
        } else if (state.sortBy.startsWith("conclusion")) {
          apiSortBy = "PLANNED_CONCLUSION_DATE";
          apiSortOrder = state.sortBy.endsWith("Asc") ? "ASC" : "DESC";
        }
        if (apiSortBy) {
          bodyData = {
            ...bodyData,
            sortBy: apiSortBy,
            sortOrder: apiSortOrder,
          };
        }

        // add query string
        if (state.appliedFilters.query) {
          bodyData = {
            ...bodyData,
            [state.searchBy]: state.appliedFilters.query,
          };
        }

        const {
          mainBeneficiaries,
          otherBeneficiaries,
          amountsMin,
          amountsMax,
          projectsAmountMin,
          projectsAmountMax,
          ...optionalFilters
        } = state.appliedFilters;

        // add beneficiaries types
        if (state.subject === "beneficiaries") {
          const entityRole: string[] = [];
          if (mainBeneficiaries) {
            entityRole.push(BENEFICIARIES_TYPES.mainBeneficiaries);
          }
          if (otherBeneficiaries) {
            entityRole.push(BENEFICIARIES_TYPES.otherBeneficiaries);
          }
          bodyData = { ...bodyData, entityRole: entityRole };
        }

        // add optional filters
        Object.keys(optionalFilters).forEach((key) => {
          const value = optionalFilters[key];
          if (value) bodyData = { ...bodyData, [key]: value };
        });

        // add ranged filters
        if (amountsMin) {
          bodyData = {
            ...bodyData,
            [state.indicator === "financed"
              ? "approvedValueMin"
              : state.indicator === "executed"
                ? "executedValueMin"
                : "paidValueMin"]: Number(amountsMin),
          };
        }
        if (amountsMax) {
          bodyData = {
            ...bodyData,
            [state.indicator === "financed"
              ? "approvedValueMax"
              : state.indicator === "executed"
                ? "executedValueMax"
                : "paidValueMax"]: Number(amountsMax),
          };
        }
        if (projectsAmountMin) {
          bodyData = {
            ...bodyData,
            projectsAmountMin: Number(projectsAmountMin),
          };
        }
        if (projectsAmountMax) {
          bodyData = {
            ...bodyData,
            projectsAmountMax: Number(projectsAmountMax),
          };
        }

        const res = await fetch(state.apiRoute, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyData),
        });

        if (!res.ok) {
          throw new Error("Search request failed");
        }

        const data = await res.json();

        const nPages = Math.ceil(data.totalFiltered / LIMIT);

        set({
          data: data.data,
          total: data.total,
          totalFiltered: data.totalFiltered,
          loading: false,
          rangedFiltersDetails: data.filters,
          nPages: nPages,
        });
      } catch (error) {
        console.error(error);
        set({ loading: false });
      }
    },

    downloadList: async (
      filename: string,
      pathnameArray: string[],
      source: string,
      update: string,
      t: ReturnType<typeof useTranslation>["t"]
    ) => {
      // search data with current filters, but without pagination

      const state = get();
      const params = new URLSearchParams();

      params.set("searchBy", state.searchBy);
      params.set("indicator", state.indicator);
      params.set("sortBy", state.sortBy);

      let data: Record<string, string | number | object>[] = [];

      Object.entries(state.appliedFilters).forEach(([key, value]) => {
        params.set(key, String(value));
      });

      // update url query params
      if (typeof window !== "undefined") {
        window.history.pushState(null, "", `?${params.toString()}`);
      }

      set({ loading: true });

      try {
        let bodyData: Record<string, FilterValue> = {
          limit: state.totalFiltered,
          page: 1,
        };

        // add sortBy and sortOrder based on state.sortBy
        let apiSortBy: string = "";
        let apiSortOrder: string = "DESC";
        if (state.sortBy.startsWith("amount")) {
          apiSortBy =
            state.indicator === "financed"
              ? "APPROVED_VALUE"
              : state.indicator === "executed"
                ? "EXECUTED_VALUE"
                : "PAID_VALUE";
          apiSortOrder = state.sortBy.endsWith("Asc") ? "ASC" : "DESC";
        } else if (state.sortBy.startsWith("projects")) {
          apiSortBy = "PROJECTS_AMOUNT";
          apiSortOrder = state.sortBy.endsWith("Asc") ? "ASC" : "DESC";
        }
        if (apiSortBy) {
          bodyData = {
            ...bodyData,
            sortBy: apiSortBy,
            sortOrder: apiSortOrder,
          };
        }

        // add query string
        if (state.appliedFilters.query) {
          bodyData = {
            ...bodyData,
            [state.searchBy]: state.appliedFilters.query,
          };
        }

        const {
          mainBeneficiaries,
          otherBeneficiaries,
          amountsMin,
          amountsMax,
          projectsAmountMin,
          projectsAmountMax,
          ...optionalFilters
        } = state.appliedFilters;

        // add beneficiaries types
        if (state.subject === "beneficiaries") {
          const entityRole: string[] = [];
          if (mainBeneficiaries) {
            entityRole.push(BENEFICIARIES_TYPES.mainBeneficiaries);
          }
          if (otherBeneficiaries) {
            entityRole.push(BENEFICIARIES_TYPES.otherBeneficiaries);
          }
          bodyData = { ...bodyData, entityRole: entityRole };
        }

        // add optional filters
        Object.keys(optionalFilters).forEach((key) => {
          const value = optionalFilters[key];
          if (value) bodyData = { ...bodyData, [key]: value };
        });

        // add ranged filters
        if (amountsMin) {
          bodyData = {
            ...bodyData,
            [state.indicator === "financed"
              ? "approvedValueMin"
              : state.indicator === "executed"
                ? "executedValueMin"
                : "paidValueMin"]: Number(amountsMin),
          };
        }
        if (amountsMax) {
          bodyData = {
            ...bodyData,
            [state.indicator === "financed"
              ? "approvedValueMax"
              : state.indicator === "executed"
                ? "executedValueMax"
                : "paidValueMax"]: Number(amountsMax),
          };
        }
        if (projectsAmountMin) {
          bodyData = {
            ...bodyData,
            projectsAmountMin: Number(projectsAmountMin),
          };
        }
        if (projectsAmountMax) {
          bodyData = {
            ...bodyData,
            projectsAmountMax: Number(projectsAmountMax),
          };
        }

        const res = await fetch(state.apiRoute, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyData),
        });

        console.log("\n\n");
        console.log("state.apiRoute", state.apiRoute);
        console.log("bodyData", bodyData);
        console.log("res", res);
        console.log("\n\n");

        if (!res.ok) {
          throw new Error("Search request failed");
        }

        const { data: flattenedData } = flattenData(await res.json());
        data = flattenedData as Record<string, string | number | object>[];

        set({
          loading: false,
        });
      } catch (error) {
        console.error(error);
        set({ loading: false });
      }

      // prepare the file to download

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Data");

      const headerData = [
        ["Mais Transparência"],
        [t(pathnameArray[1])],
        [t(pathnameArray[2])],
        [t(pathnameArray[3]) + " - " + filename],
        [], // Empty row for spacing
      ];
      worksheet.addRows(headerData);

      const headers: string[] = Object.keys(data[0]);
      const headersTranslated: string[] = headers.map((key) => t(`searchBenProj.fields.${key}`));
      worksheet.addRow(headersTranslated);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.forEach((item: Record<string, any>) => {
        worksheet.addRow(headers.map((header) => item[header] ?? ""));
      });

      const footerData = [
        [], // Empty row
        [t("source"), source || "N/A"],
        [t("update"), update || "N/A"],
      ];
      worksheet.addRows(footerData);

      // send the file to download

      const buffer = await workbook.csv.writeBuffer();

      // Adicionar BOM (Byte Order Mark) para UTF-8
      const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), buffer], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.setAttribute("href", url);
      link.setAttribute("download", `${filename || "table-data"}_${new Date().toISOString()}.csv`);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  }));
};

export const searchBenProjStore = createSearchBenProjStore("beneficiaries", "");
