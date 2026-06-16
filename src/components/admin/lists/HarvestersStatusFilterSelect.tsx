import { InputSelect } from "@ama-pt/agora-design-system";
import { DropdownSection, DropdownOption } from "@ama-pt/agora-design-system";

type HarvestersStatusFilterSelectProps = {
  statusFilter: string;
  onChange: (nextStatus: string) => void;
  id?: string;
  placeholder?: string;
};

export default function HarvestersStatusFilterSelect({
  statusFilter,
  onChange,
  id = "filter-status",
  placeholder = "Filtrar por estado",
}: HarvestersStatusFilterSelectProps) {
  return (
    <InputSelect
      label=""
      hideLabel
      placeholder={placeholder}
      id={id}
      onChange={(options) => {
        onChange(options.length > 0 ? (options[0].value as string) : "");
      }}
    >
      <DropdownSection name="status">
        <DropdownOption value="" selected={statusFilter === ""}>
          Todos
        </DropdownOption>
        <DropdownOption value="pending" selected={statusFilter === "pending"}>
          Em espera de validação
        </DropdownOption>
        <DropdownOption value="accepted" selected={statusFilter === "accepted"}>
          Validado
        </DropdownOption>
        <DropdownOption value="refused" selected={statusFilter === "refused"}>
          Recusado
        </DropdownOption>
        <DropdownOption value="done" selected={statusFilter === "done"}>
          Terminado
        </DropdownOption>
        <DropdownOption value="failed" selected={statusFilter === "failed"}>
          Falhado
        </DropdownOption>
      </DropdownSection>
    </InputSelect>
  );
}
