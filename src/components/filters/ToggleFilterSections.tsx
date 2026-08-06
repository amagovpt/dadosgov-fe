"use client";

import { Pill, Toggle } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";

export interface ToggleFilterOption {
  id: string;
  label: string;
  description?: string;
  count?: number | string;
}

export interface ToggleFilterSection {
  key: string;
  title: string;
  options: ToggleFilterOption[];
}

interface ToggleFilterSectionsProps {
  sections: ToggleFilterSection[];
  selectedValues: Record<string, string>;
  onChange: (sectionKey: string, optionId: string) => void;
  idPrefix: string;
}

function renderCountLabel(count: number | string, locale: string): string {
  const localeToUse = locale === "pt" ? "pt-PT" : locale === "en" ? "en-GB" : locale;
  if (typeof count === "number") {
    return count.toLocaleString(localeToUse);
  }
  return count;
}

export function ToggleFilterSections({
  sections,
  selectedValues,
  onChange,
  idPrefix,
}: ToggleFilterSectionsProps) {
  const { t, i18n } = useTranslation("common");
  return (
    <div className="flex flex-col gap-32 mt-[36px] mb-[36px]">
      <h2 className="font-bold text-xl text-neutral-900">{t("filters.filters")}</h2>
      {sections.map((section) => (
        <div key={section.key} className="pr-32 max-w-[592px] flex flex-col gap-8">
          <h3 className="font-bold text-base text-neutral-900 mb-8">{section.title}</h3>
          {section.options.map((option) => {
            const isSelected = selectedValues[section.key] === option.id;
            return (
              <Toggle
                key={option.id}
                id={`${idPrefix}-${section.key}-${option.id}`}
                name={`${idPrefix}-${section.key}`}
                value={option.id}
                appearance="icon"
                variant="primary"
                checked={isSelected}
                onChange={() => onChange(section.key, option.id)}
                iconOnly={false}
                fullWidth={true}
                className="w-full"
              >
                <div className="flex items-center gap-12 font-bold text-sm">
                  <span
                    className={
                      isSelected ? "text-primary-600 font-bold" : "text-neutral-900 font-bold"
                    }
                  >
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="text-neutral-900 text-xs font-normal ml-8">
                      {option.description}
                    </span>
                  )}
                  {option.count !== undefined && (
                    <Pill
                      variant="neutral"
                      appearance="outline"
                      circular={false}
                      className="text-xs font-medium text-neutral-500 ml-16"
                    >
                      {renderCountLabel(option.count, i18n.language)}
                    </Pill>
                  )}
                </div>
              </Toggle>
            );
          })}
        </div>
      ))}
    </div>
  );
}
