"use client";

import { InputSelect } from "@ama-pt/agora-design-system";
import { Dropdown } from "@/components/Primitives/Dropdown";
import { useTranslation } from "react-i18next";

interface DatasetsStatusFilterSelectProps {
  statusFilter: string;
  onChange: (status: string) => void;
  id?: string;
  placeholder?: string;
  defaultValue?: string;
}

export default function DatasetsStatusFilterSelect({
  statusFilter,
  onChange,
  id = "filter-status",
  placeholder,
  defaultValue,
}: DatasetsStatusFilterSelectProps) {
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
      <Dropdown.Section name="status">
        <Dropdown.Option value="" selected={statusFilter === ""}>
          {t("filters.all")}
        </Dropdown.Option>
        <Dropdown.Option value="public" selected={statusFilter === "public"}>
          {t("status.public")}
        </Dropdown.Option>
        <Dropdown.Option value="archived" selected={statusFilter === "archived"}>
          {t("status.archived")}
        </Dropdown.Option>
        <Dropdown.Option value="draft" selected={statusFilter === "draft"}>
          {t("status.draft")}
        </Dropdown.Option>
        <Dropdown.Option value="deleted" selected={statusFilter === "deleted"}>
          {t("status.deleted")}
        </Dropdown.Option>
      </Dropdown.Section>
    </InputSelect>
  );
}
