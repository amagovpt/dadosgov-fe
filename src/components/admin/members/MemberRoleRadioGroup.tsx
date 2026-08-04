"use client";

import { useTranslation } from "react-i18next";
import { RadioButton } from "@ama-pt/agora-design-system";
import type { MemberRole } from "./membersConstants";

interface MemberRoleRadioGroupProps {
  value: string;
  onChange: (role: MemberRole) => void;
  name: string;
  adminId: string;
  editorId: string;
  gapClass?: string;
}

export function MemberRoleRadioGroup({
  value,
  onChange,
  name,
  adminId,
  editorId,
  gapClass = "gap-24",
}: MemberRoleRadioGroupProps) {
  const { t } = useTranslation("admin-members");

  return (
    <div className={`flex ${gapClass}`}>
      <RadioButton
        id={adminId}
        name={name}
        value="admin"
        label={t("roles.admin")}
        checked={value === "admin"}
        onChange={() => onChange("admin")}
      />
      <RadioButton
        id={editorId}
        name={name}
        value="editor"
        label={t("roles.editor")}
        checked={value === "editor"}
        onChange={() => onChange("editor")}
      />
    </div>
  );
}
