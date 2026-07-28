"use client";

import { useTranslation } from "react-i18next";
import {
  DropdownOption,
  DropdownSection,
  InputSelect,
  StatusCard,
} from "@ama-pt/agora-design-system";

interface HarvesterStatusFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function HarvesterStatusFilter({ value, onChange }: HarvesterStatusFilterProps) {
  const { t } = useTranslation(["admin-common", "admin-harvesters"]);

  return (
    <>
      <InputSelect
        label=""
        hideLabel
        placeholder={t("admin-common:filters.statusPlaceholder")}
        id="filter-status"
        onChange={(options) => {
          onChange(options.length > 0 ? (options[0].value as string) : "");
        }}
      >
        <DropdownSection name="status">
          <DropdownOption value="" selected={value === ""}>
            {t("admin-harvesters:filters.options.all")}
          </DropdownOption>
          <DropdownOption value="pending" selected={value === "pending"}>
            {t("admin-harvesters:filters.options.pending")}
          </DropdownOption>
          <DropdownOption value="accepted" selected={value === "accepted"}>
            {t("admin-harvesters:filters.options.accepted")}
          </DropdownOption>
          <DropdownOption value="refused" selected={value === "refused"}>
            {t("admin-harvesters:filters.options.refused")}
          </DropdownOption>
          <DropdownOption value="done" selected={value === "done"}>
            {t("admin-harvesters:filters.options.done")}
          </DropdownOption>
          <DropdownOption value="failed" selected={value === "failed"}>
            {t("admin-harvesters:filters.options.failed")}
          </DropdownOption>
        </DropdownSection>
      </InputSelect>

      {value === "accepted" && (
        <div className="mb-24">
          <StatusCard
            variant="informative"
            showIcon
            description={t("admin-harvesters:filters.acceptedInfo")}
          />
        </div>
      )}
    </>
  );
}
