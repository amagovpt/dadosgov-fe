"use client";

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
  return (
    <>
      <InputSelect
        label=""
        hideLabel
        placeholder="Filtrar por estado"
        id="filter-status"
        onChange={(options) => {
          onChange(options.length > 0 ? (options[0].value as string) : "");
        }}
      >
        <DropdownSection name="status">
          <DropdownOption value="" selected={value === ""}>
            Todos
          </DropdownOption>
          <DropdownOption value="pending" selected={value === "pending"}>
            Em espera de validação
          </DropdownOption>
          <DropdownOption value="accepted" selected={value === "accepted"}>
            Validado
          </DropdownOption>
          <DropdownOption value="refused" selected={value === "refused"}>
            Recusado
          </DropdownOption>
          <DropdownOption value="done" selected={value === "done"}>
            Terminado
          </DropdownOption>
          <DropdownOption value="failed" selected={value === "failed"}>
            Falhado
          </DropdownOption>
        </DropdownSection>
      </InputSelect>

      {value === "accepted" && (
        <div className="mb-24">
          <StatusCard
            variant="informative"
            showIcon
            description="O estado 'Validado' refere-se ao processo de aprovação do harvester e é independente da última execução — a lista pode incluir harvesters com última execução 'Terminado' ou 'Falhado'."
          />
        </div>
      )}
    </>
  );
}
