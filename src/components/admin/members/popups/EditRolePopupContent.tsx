"use client";

import { useState } from "react";
import { Button, usePopupContext } from "@ama-pt/agora-design-system";
import { updateMemberRole } from "@/service/api/organizations";
import type { OrganizationMember } from "@/service/types/identity";
import { MemberRoleRadioGroup } from "../MemberRoleRadioGroup";

interface EditRolePopupContentProps {
  orgId: string;
  member: OrganizationMember;
  onRoleUpdated: () => void;
  openKey: number;
}

export function EditRolePopupContent({
  orgId,
  member,
  onRoleUpdated,
  openKey,
}: EditRolePopupContentProps) {
  const { hide } = usePopupContext();
  const [selectedRole, setSelectedRole] = useState(member.role);

  const handleUpdate = async () => {
    try {
      await updateMemberRole(orgId, member.user.id, selectedRole);
      onRoleUpdated();
      hide();
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  return (
    <form
      className="flex flex-col gap-24"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void handleUpdate();
      }}
    >
      <p className="text-neutral-900">
        Alterar o papel de{" "}
        <strong>
          {member.user.first_name} {member.user.last_name}
        </strong>
      </p>

      <div className="flex flex-col gap-12">
        <span className="text-base font-medium leading-7 text-primary-900">Papel do membro</span>
        <MemberRoleRadioGroup
          value={selectedRole}
          onChange={setSelectedRole}
          name={`role-${openKey}`}
          adminId="role-admin"
          editorId="role-editor"
          gapClass="gap-16"
        />
      </div>

      <div className="flex gap-16">
        <Button type="button" appearance="outline" variant="primary" onClick={() => hide()}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          hasIcon
          trailingIcon="agora-line-check-circle"
          trailingIconHover="agora-solid-check-circle"
        >
          Guardar
        </Button>
      </div>
    </form>
  );
}
