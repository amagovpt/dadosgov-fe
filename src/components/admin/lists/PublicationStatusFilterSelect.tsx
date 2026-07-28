"use client";

import { DropdownOption, DropdownSection, InputSelect } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";

interface PublicationStatusFilterSelectProps {
  statusFilter: string;
  onChange: (status: string) => void;
  id?: string;
  placeholder?: string;
  defaultValue?: string;
}

export default function PublicationStatusFilterSelect({
  statusFilter,
  onChange,
  id = "filter-status",
  placeholder,
  defaultValue,
}: PublicationStatusFilterSelectProps) {
  const { t } = useTranslation("admin-common");
  const resolvedPlaceholder = placeholder ?? t("filters.statusPlaceholder");

  return (
    <InputSelect
      label=""
      hideLabel
      placeholder={resolvedPlaceholder}
      id={id}
      defaultValue={defaultValue}
      onChange={(options) => {
        onChange(options.length > 0 ? (options[0].value as string) : "");
      }}
    >
      <DropdownSection name="status">
        <DropdownOption value="" selected={statusFilter === ""}>
          {t("filters.all")}
        </DropdownOption>
        <DropdownOption value="public" selected={statusFilter === "public"}>
          {t("status.public")}
        </DropdownOption>
        <DropdownOption value="archived" selected={statusFilter === "archived"}>
          {t("status.archived")}
        </DropdownOption>
        <DropdownOption value="draft" selected={statusFilter === "draft"}>
          {t("status.draft")}
        </DropdownOption>
        <DropdownOption value="deleted" selected={statusFilter === "deleted"}>
          {t("status.deleted")}
        </DropdownOption>
      </DropdownSection>
    </InputSelect>
  );
}
