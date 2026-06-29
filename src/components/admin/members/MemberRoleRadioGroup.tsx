"use client";

import { RadioButton } from "@ama-pt/agora-design-system";
import { ROLE_LABELS, type MemberRole } from "./membersConstants";

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
  return (
    <div className={`flex ${gapClass}`}>
      <RadioButton
        id={adminId}
        name={name}
        value="admin"
        label={ROLE_LABELS.admin}
        checked={value === "admin"}
        onChange={() => onChange("admin")}
      />
      <RadioButton
        id={editorId}
        name={name}
        value="editor"
        label={ROLE_LABELS.editor}
        checked={value === "editor"}
        onChange={() => onChange("editor")}
      />
    </div>
  );
}
