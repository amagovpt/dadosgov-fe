import { DropdownOption, DropdownSection, InputSelect } from "@ama-pt/agora-design-system";

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
  placeholder = "Filtrar por estado",
  defaultValue,
}: PublicationStatusFilterSelectProps) {
  return (
    <InputSelect
      label=""
      hideLabel
      placeholder={placeholder}
      id={id}
      defaultValue={defaultValue}
      onChange={(options) => {
        onChange(options.length > 0 ? (options[0].value as string) : "");
      }}
    >
      <DropdownSection name="status">
        <DropdownOption value="" selected={statusFilter === ""}>
          Todos
        </DropdownOption>
        <DropdownOption value="public" selected={statusFilter === "public"}>
          Público
        </DropdownOption>
        <DropdownOption value="archived" selected={statusFilter === "archived"}>
          Arquivado
        </DropdownOption>
        <DropdownOption value="draft" selected={statusFilter === "draft"}>
          Rascunho
        </DropdownOption>
        <DropdownOption value="deleted" selected={statusFilter === "deleted"}>
          Excluído
        </DropdownOption>
      </DropdownSection>
    </InputSelect>
  );
}
