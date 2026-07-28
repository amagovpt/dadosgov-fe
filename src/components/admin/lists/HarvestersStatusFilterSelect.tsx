import { InputSelect } from "@ama-pt/agora-design-system";
import { DropdownSection, DropdownOption } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";

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
  placeholder,
}: HarvestersStatusFilterSelectProps) {
  const { t } = useTranslation(["admin-common", "admin-harvesters"]);

  return (
    <InputSelect
      label=""
      hideLabel
      placeholder={placeholder ?? t("admin-common:filters.statusPlaceholder")}
      id={id}
      onChange={(options) => {
        onChange(options.length > 0 ? (options[0].value as string) : "");
      }}
    >
      <DropdownSection name="status">
        <DropdownOption value="" selected={statusFilter === ""}>
          {t("admin-harvesters:filters.options.all")}
        </DropdownOption>
        <DropdownOption value="pending" selected={statusFilter === "pending"}>
          {t("admin-harvesters:filters.options.pending")}
        </DropdownOption>
        <DropdownOption value="accepted" selected={statusFilter === "accepted"}>
          {t("admin-harvesters:filters.options.accepted")}
        </DropdownOption>
        <DropdownOption value="refused" selected={statusFilter === "refused"}>
          {t("admin-harvesters:filters.options.refused")}
        </DropdownOption>
        <DropdownOption value="done" selected={statusFilter === "done"}>
          {t("admin-harvesters:filters.options.done")}
        </DropdownOption>
        <DropdownOption value="failed" selected={statusFilter === "failed"}>
          {t("admin-harvesters:filters.options.failed")}
        </DropdownOption>
      </DropdownSection>
    </InputSelect>
  );
}
