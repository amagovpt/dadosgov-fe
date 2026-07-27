"use client";

import { InputSelect, DropdownSection, DropdownOption } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";

type Option = { value: string; label: string };

type Props = {
  value?: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
  options?: Option[];
  defaultValue?: string | undefined;
};

export function StatusFilterSelect({
  value = "",
  onChange,
  id = "filter-status",
  placeholder,
  className,
  options,
  defaultValue,
}: Props) {
  const { t } = useTranslation("admin-common");
  const resolvedPlaceholder = placeholder ?? t("filters.statusPlaceholder");
  const opts: Option[] =
    options ?? [
      { value: "", label: t("filters.all") },
      { value: "public", label: t("status.public") },
      { value: "archived", label: t("status.archived") },
      { value: "draft", label: t("status.draft") },
      { value: "deleted", label: t("status.deleted") },
    ];

  return (
    <InputSelect
      id={id}
      label=""
      hideLabel
      placeholder={resolvedPlaceholder}
      className={className}
      defaultValue={defaultValue ?? (value || undefined)}
      onChange={(options) => {
        onChange(options.length > 0 ? (options[0].value as string) : "");
      }}
    >
      <DropdownSection name="status">
        {opts.map((o) => (
          <DropdownOption key={o.value} value={o.value} selected={value === o.value}>
            {o.label}
          </DropdownOption>
        ))}
      </DropdownSection>
    </InputSelect>
  );
}

export default StatusFilterSelect;
