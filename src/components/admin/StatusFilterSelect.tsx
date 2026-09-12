"use client";

import { useEffect, useState } from "react";
import { Toggle, ToggleGroup } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";

type Option = { value: string; label: string; icon?: string };

type Props = {
  value?: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
  options?: Option[];
  defaultValue?: string | undefined;
};

const DEFAULT_STATUS_ICONS: Record<string, string> = {
  "": "agora-line-layers-menu",
  public: "agora-line-globe",
  draft: "agora-line-file",
  archived: "agora-line-folder",
  deleted: "agora-line-trash",
};

export function StatusFilterSelect({
  value = "",
  onChange,
  id = "filter-status",
  className,
  options,
  defaultValue,
}: Props) {
  const { t } = useTranslation("admin-common");
  const [isVertical, setIsVertical] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const update = () => setIsVertical(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  const opts: Option[] =
    options ?? [
      { value: "", label: t("filters.all"), icon: DEFAULT_STATUS_ICONS[""] },
      { value: "public", label: t("status.public"), icon: DEFAULT_STATUS_ICONS.public },
      { value: "archived", label: t("status.archived"), icon: DEFAULT_STATUS_ICONS.archived },
      { value: "draft", label: t("status.draft"), icon: DEFAULT_STATUS_ICONS.draft },
      { value: "deleted", label: t("status.deleted"), icon: DEFAULT_STATUS_ICONS.deleted },
    ];

  return (
    <ToggleGroup
      id={id}
      className={className}
      variant="primary"
      appearance="button"
      orientation={isVertical ? "vertical" : "horizontal"}
      fullWidth
      multiple={false}
      value={value || defaultValue || ""}
      onChange={(vals) => onChange(vals[0] ?? "")}
    >
      {opts.map((o) => {
        const icon = o.icon ?? DEFAULT_STATUS_ICONS[o.value];
        const iconHover = icon?.startsWith("agora-line-")
          ? icon.replace("agora-line-", "agora-solid-")
          : undefined;
        return (
          <Toggle
            key={o.value}
            value={o.value}
            hasIcon={Boolean(icon)}
            leadingIcon={icon}
            leadingIconHover={iconHover}
          >
            {o.label}
          </Toggle>
        );
      })}
    </ToggleGroup>
  );
}

export default StatusFilterSelect;
