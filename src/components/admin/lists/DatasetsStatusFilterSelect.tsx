import { InputSelect } from "@ama-pt/agora-design-system";
import { Dropdown } from "@/components/Primitives/Dropdown";

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
  placeholder = "Filtrar por estado",
  defaultValue,
}: DatasetsStatusFilterSelectProps) {
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
      <Dropdown.Section name="status">
        <Dropdown.Option value="" selected={statusFilter === ""}>
          Todos
        </Dropdown.Option>
        <Dropdown.Option value="public" selected={statusFilter === "public"}>
          Público
        </Dropdown.Option>
        <Dropdown.Option value="archived" selected={statusFilter === "archived"}>
          Arquivado
        </Dropdown.Option>
        <Dropdown.Option value="draft" selected={statusFilter === "draft"}>
          Rascunho
        </Dropdown.Option>
        <Dropdown.Option value="deleted" selected={statusFilter === "deleted"}>
          Excluído
        </Dropdown.Option>
      </Dropdown.Section>
    </InputSelect>
  );
}
