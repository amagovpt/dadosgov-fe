"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Button,
  DropdownOption,
  DropdownSection,
  StatusCard,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import { addMember } from "@/service/api/organizations";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import { MemberRoleRadioGroup } from "../MemberRoleRadioGroup";
import { DEFAULT_MEMBER_ROLE, type MemberRole } from "../membersConstants";
import { useUserSearch } from "../hooks/useUserSearch";

interface AddMemberPopupContentProps {
  orgId: string;
  onMemberAdded: () => void;
  openKey: number;
}

export function AddMemberPopupContent({
  orgId,
  onMemberAdded,
  openKey,
}: AddMemberPopupContentProps) {
  const { hide } = usePopupContext();
  const selectedUserIdRef = useRef("");
  const [selectedRole, setSelectedRole] = useState<MemberRole>(DEFAULT_MEMBER_ROLE);
  const [canSubmit, setCanSubmit] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [hasPendingInvite, setHasPendingInvite] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const { dropdownUsers, setSearchQuery, isSearching, getUserStatus } = useUserSearch(orgId);

  const userDropdownChildren = useMemo(
    () => (
      <DropdownSection name="users">
        {dropdownUsers.map((user) => (
          <DropdownOption key={user.id} value={user.id}>
            {`${user.first_name} ${user.last_name}`}
          </DropdownOption>
        ))}
      </DropdownSection>
    ),
    [dropdownUsers]
  );

  const handleAdd = async () => {
    if (!canSubmit) return;

    setAddError(null);
    try {
      await addMember(orgId, selectedUserIdRef.current, selectedRole);
      onMemberAdded();
      hide();
    } catch (error) {
      console.error("Error adding member:", error);
      const message = error instanceof Error ? error.message : null;
      setAddError(message || "Ocorreu um erro ao adicionar o membro. Tente novamente.");
    }
  };

  const onUserChangeCallback = useCallback(
    (userId: string) => {
      const { isMember, isPending } = getUserStatus(userId);
      setCanSubmit(!!userId && !isMember && !isPending);
      setAlreadyMember(isMember);
      setHasPendingInvite(isPending);
    },
    [getUserStatus]
  );

  return (
    <div className="flex flex-col gap-24">
      {hasPendingInvite && (
        <StatusCard
          variant="informative"
          showIcon
          description="Este utilizador já foi convidado para esta organização. O convite encontra-se pendente de aceitação."
        />
      )}
      <div className="flex flex-col gap-4">
        <span className="text-base font-medium leading-7 text-primary-900">
          Utilizador <span className="text-danger-600">*</span>
        </span>
        <IsolatedSelect
          key={`user-${openKey}`}
          label="Utilizador"
          hideLabel
          placeholder="Pesquisar um utilizador"
          id="member-user"
          onChangeRef={selectedUserIdRef}
          searchable
          searchInputPlaceholder="Escreva pelo menos 2 caracteres..."
          searchNoResultsText={isSearching ? "A pesquisar..." : "Nenhum utilizador encontrado"}
          hasError={alreadyMember}
          errorFeedbackText="Utilizador já está associado a esta organização"
          onChangeCallback={onUserChangeCallback}
          onSearchCallback={setSearchQuery}
        >
          {userDropdownChildren}
        </IsolatedSelect>
      </div>

      <div className="flex flex-col gap-12">
        <span className="text-base font-medium leading-7 text-primary-900">
          Papel do membro <span className="text-danger-600">*</span>
        </span>
        <MemberRoleRadioGroup
          value={selectedRole}
          onChange={setSelectedRole}
          name={`role-${openKey}`}
          adminId={`role-admin-${openKey}`}
          editorId={`role-editor-${openKey}`}
        />
      </div>

      {addError && <p className="text-sm text-danger-600">{addError}</p>}

      <div className="flex gap-16">
        <Button appearance="outline" variant="primary" onClick={() => hide()}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleAdd} disabled={!canSubmit}>
          Adicionar
        </Button>
      </div>
    </div>
  );
}
