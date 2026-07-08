"use client";

import { useState } from "react";
import { Button, usePopupContext } from "@ama-pt/agora-design-system";
import { removeMember } from "@/service/api/organizations";
import type { OrganizationMember } from "@/service/types/identity";

interface RemoveMemberPopupContentProps {
  orgId: string;
  member: OrganizationMember;
  onMemberRemoved: () => void;
}

export function RemoveMemberPopupContent({
  orgId,
  member,
  onMemberRemoved,
}: RemoveMemberPopupContentProps) {
  const { hide } = usePopupContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRemove = async () => {
    setIsSubmitting(true);
    try {
      await removeMember(orgId, member.user.id);
      onMemberRemoved();
      hide();
    } catch (error) {
      console.error("Error removing member:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-24">
      <p className="text-neutral-900">Tem a certeza que deseja eliminar este membro?</p>
      <div className="flex gap-16">
        <Button appearance="outline" variant="primary" onClick={() => hide()}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          hasIcon
          leadingIcon="agora-line-trash"
          leadingIconHover="agora-solid-trash"
          onClick={handleRemove}
          disabled={isSubmitting}
        >
          {isSubmitting ? "A eliminar..." : "Eliminar"}
        </Button>
      </div>
    </div>
  );
}
