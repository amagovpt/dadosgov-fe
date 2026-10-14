"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { SidebarItem, InputSearch, RadioButton, Sidebar } from "@ama-pt/agora-design-system";
import { useSearchBenProjStore } from "@/hooks/useSearchBenProj";
import useMobile from "@/hooks/useMobile";

export interface SpecificObjectiveFilterProps {
  locale: string;
}

interface SpecificObjective {
  code: string;
  shortName: string;
}

export default function SpecificObjectiveFilter({
  locale,
}: SpecificObjectiveFilterProps) {
  const { t } = useTranslation();
  const isMobile = useMobile();

  const filters = useSearchBenProjStore((state) => state.filters);
  const appliedFilters = useSearchBenProjStore((state) => state.appliedFilters);
  const addFilter = useSearchBenProjStore((state) => state.addFilter);
  const removeFilter = useSearchBenProjStore((state) => state.removeFilter);

  const [specificObjectives, setSpecificObjectives] = useState<SpecificObjective[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState<string>("");
  const [filteredOptions, setFilteredOptions] = useState<SpecificObjective[]>([]);

  const policyObjective = filters["policyObjectives"] as string | undefined;

  useEffect(() => {
    if (policyObjective) {
      setLoading(true);
      
      fetch(`/internal-api/fundos-europeus/pt2030/beneficiarios-e-projetos/specific-objectives?policyObjective=${encodeURIComponent(policyObjective)}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((result) => {
          const data = result.data || [];
          setSpecificObjectives(data);
          setSearchValue("");
        })
        .catch((error) => {
          console.error("Error fetching specific objectives:", error);
          setSpecificObjectives([]);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setSpecificObjectives([]);
      setSearchValue("");
      if (appliedFilters["specificObjectiveShortName"] || filters["specificObjectiveShortName"]) {
        removeFilter("specificObjectiveShortName", t, locale);
      }
    }
  }, [policyObjective, removeFilter, appliedFilters, filters, t, locale]);

  useEffect(() => {
    const filtered = specificObjectives.filter((obj) =>
      obj.shortName.toLowerCase().includes(searchValue.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [specificObjectives, searchValue]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
  }, []);

  const handleChange = useCallback(
    (value: string) => {
      if (appliedFilters["specificObjectiveShortName"] && appliedFilters["specificObjectiveShortName"] === value) {
        removeFilter("specificObjectiveShortName", t, locale);
      } else {
        addFilter("specificObjectiveShortName", value, t, locale, isMobile);
      }
    },
    [appliedFilters, addFilter, removeFilter, t, locale, isMobile]
  );

  if (!policyObjective) {
    return null;
  }

  const selectedValue = (appliedFilters["specificObjectiveShortName"] as string) || "";
  const label = t("aboutPt2030.specificObjectivesCapitalized")

  return (
    <Sidebar aria-label={label} variant="filter">
      <SidebarItem
      aria-label={label}
      item={{
        children: label,
        hasIcon: true,
        collapsedIconTrailing: "agora-line-minus-circle",
        collapsedIconHoverTrailing: "agora-solid-minus-circle",
        expandedIconTrailing: "agora-line-plus-circle",
        expandedIconHoverTrailing: "agora-solid-plus-circle",
      }}
    >
      <div className="flex flex-col gap-8 pt-8 pb-32">
        {specificObjectives.length > 5 && (
          <InputSearch
            placeholder={`${t("pesquisar")} ${label}`}
            value={searchValue}
            onChange={handleSearchChange}
          />
        )}

        {loading ? (
          <div className="text-center text-sm text-gray-500">{t("loading")}</div>
        ) : filteredOptions.length === 0 ? (
          <div className="text-center text-sm text-gray-500">{t("noResults")}</div>
        ) : (
          <div className="flex flex-col gap-8 overflow-y-auto overflow-x-hidden max-h-[600px]">
            {filteredOptions.map((option) => (
              <div key={option.code} className="w-full min-w-0">
                <RadioButton
                  label={option.shortName}
                  value={option.shortName}
                  name="specificObjectiveShortName"
                  checked={selectedValue === option.shortName}
                  onClick={() => handleChange(option.shortName)}
                  className="!w-full"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </SidebarItem>
    </Sidebar>
  );
}
