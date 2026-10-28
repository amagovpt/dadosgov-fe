"use client";

import { DropdownOption, DropdownSection, Tag } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import { AdminSearch } from "@/components/admin/lists/AdminSearch";
import Button from "@/components/Primitives/Button";

const filterTagClassName =
  "h-auto! min-h-[44px]! max-w-full px-16! py-8! [&>.children-wrapper]:min-w-0 [&>.children-wrapper]:text-s-regular! [&>.children-wrapper]:text-neutral-700 [&>.children-wrapper]:[overflow-wrap:anywhere] [&>.icon-wrapper]:shrink-0 [&>.icon-wrapper_svg]:fill-neutral-700";

interface DiscussionsFiltersProps {
  searchValue: string;
  appliedSearch: string;
  status: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onStatusChange: (value: string) => void;
  onClear: () => void;
}

export default function DiscussionsFilters({
  searchValue,
  appliedSearch,
  status,
  onSearchChange,
  onClearSearch,
  onStatusChange,
  onClear,
}: DiscussionsFiltersProps) {
  const { t } = useTranslation("admin-discussions");
  const query = appliedSearch.trim();
  const activeCount = Number(Boolean(query)) + Number(Boolean(status));
  const statusLabel = t(`filters.status.${status === "closed" ? "closed" : "open"}`);

  return (
    <div className="flex flex-col gap-32">
      <div className="grid grid-cols-1 items-end gap-32 lg:grid-cols-2">
        <div className="admin-search-wrapper min-w-0">
          <AdminSearch
            id="discussion-search"
            label={t("filters.search.toolbarLabel")}
            aria-label={t("filters.search.label")}
            placeholder={t("filters.search.placeholder")}
            value={searchValue}
            required={false}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        <div className="min-w-0">
          <IsolatedSelect
            id="discussion-filter-status"
            label={t("filters.status.label")}
            placeholder={t("filters.status.placeholder")}
            defaultValue={status}
            hideSectionNames
            onChangeCallback={(value) => {
              const nextStatus = value === "all" ? "" : value;
              if (nextStatus !== status) onStatusChange(nextStatus);
            }}
          >
            <DropdownSection name="status">
              <DropdownOption value="all">{t("filters.all")}</DropdownOption>
              <DropdownOption value="open">{t("filters.status.open")}</DropdownOption>
              <DropdownOption value="closed">{t("filters.status.closed")}</DropdownOption>
            </DropdownSection>
          </IsolatedSelect>
        </div>
      </div>

      {activeCount > 0 && (
        <div className="flex flex-col gap-8 border-t border-neutral-700 pt-16">
          <p className="text-m-bold text-neutral-900" aria-live="polite">
            {t("filters.applied", { count: activeCount })}
          </p>
          <div className="flex flex-wrap items-center gap-16">
            {query && (
              <Tag
                className={filterTagClassName}
                aria-label={t("filters.removeSearch", { query })}
                onClick={onClearSearch}
              >
                <span>
                  <strong>{t("filters.search.toolbarLabel")}</strong> {query}
                </span>
              </Tag>
            )}
            {status && (
              <Tag
                className={filterTagClassName}
                aria-label={t("filters.removeStatus", { status: statusLabel })}
                onClick={() => onStatusChange("")}
              >
                <strong>{t("filters.status.label")}</strong> {statusLabel}
              </Tag>
            )}
            <Button
              variant="primary"
              appearance="link"
              hasIcon
              leadingIcon="agora-line-trash"
              leadingIconHover="agora-solid-trash"
              onClick={onClear}
            >
              {t("filters.clear")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
