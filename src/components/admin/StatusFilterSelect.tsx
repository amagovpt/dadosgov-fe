"use client";

import { InputSelect, DropdownSection, DropdownOption } from "@ama-pt/agora-design-system";

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
  placeholder = "Filtrar por estado",
  className,
  options,
  defaultValue,
}: Props) {
  const opts: Option[] =
    options ?? [
      { value: "", label: "Todos" },
      { value: "public", label: "Público" },
      { value: "archived", label: "Arquivado" },
      { value: "draft", label: "Rascunho" },
      { value: "deleted", label: "Excluído" },
    ];

  return (
    <InputSelect
      id={id}
      label=""
      hideLabel
      placeholder={placeholder}
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
