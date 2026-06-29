"use client";

import type { ChangeEvent } from "react";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  Button,
  Icon,
  RadioButton,
  StatusCard,
  DropdownSection,
  DropdownOption,
  InputTextArea,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import { fetchOrganization, addMember, updateMemberRole, removeMember, fetchMembershipRequests, acceptMembership, refuseMembership } from "@/service/api/organizations";
import { suggestUsers } from "@/service/api/search";
import { Organization, OrganizationMember, MembershipRequest, UserSuggestion } from "@/service/types/identity";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useOrganizationName } from "@/hooks/useOrganizationName";
import { useAuth } from "@/context/AuthContext";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import AdminLayout from "@/components/Layout/AdminLayout";
import { formatDateToDMY } from "@/utils/formatDate";
import TextLink from "@/components/Primitives/TextLink";
import AdminPaginatedTable from "@/components/admin/lists/AdminPaginatedTable";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import { paginateItems } from "@/utils/admin-lists/listHelpers";
import { useAdminListController } from "@/hooks/admin-lists/useAdminListController";
import {
  createMemberColumns,
  sortMembers,
  type MemberSortField,
} from "./membersListConfig";

interface AddMemberPopupProps {
  orgId: string;
  onMemberAdded: () => void;
  openKey: number;
}

function AddMemberPopupContent({ orgId, onMemberAdded, openKey }: AddMemberPopupProps) {
  const { hide } = usePopupContext();
  const [initialSuggestions, setInitialSuggestions] = useState<UserSuggestion[]>([]);
  const [searchResults, setSearchResults] = useState<UserSuggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const memberIdsRef = useRef<string[]>([]);
  const pendingUserIdsRef = useRef<string[]>([]);
  const selectedUserIdRef = useRef("");
  const [selectedRole, setSelectedRole] = useState("editor");
  const [canSubmit, setCanSubmit] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [hasPendingInvite, setHasPendingInvite] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [users, org, requests] = await Promise.all([
          suggestUsers("", 50),
          fetchOrganization(orgId),
          fetchMembershipRequests(orgId),
        ]);
        setInitialSuggestions(users);
        memberIdsRef.current = (org?.members || []).map(
          (member: OrganizationMember) => member.user.id
        );
        pendingUserIdsRef.current = requests
          .filter((request: MembershipRequest) => request.status === "pending" && request.user)
          .map((request: MembershipRequest) => request.user.id);
      } catch (error) {
        console.error("Error loading users:", error);
      }
    }

    void loadData();
  }, [orgId]);

  useEffect(() => {
    const query = searchQuery.trim();
    let frameId: number | null = null;

    if (query.length < 2) {
      frameId = requestAnimationFrame(() => {
        setSearchResults([]);
        setIsSearching(false);
      });
      return () => {
        if (frameId !== null) cancelAnimationFrame(frameId);
      };
    }

    frameId = requestAnimationFrame(() => {
      setIsSearching(true);
    });

    const timer = setTimeout(async () => {
      try {
        const response = await suggestUsers(query, 50);
        setSearchResults(response);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const userDropdownChildren = useMemo(() => {
    const source = searchQuery.trim().length >= 2 ? searchResults : initialSuggestions;

    return (
      <DropdownSection name="users">
        {source.map((user) => (
          <DropdownOption key={user.id} value={user.id}>
            {`${user.first_name} ${user.last_name}`}
          </DropdownOption>
        ))}
      </DropdownSection>
    );
  }, [initialSuggestions, searchResults, searchQuery]);

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

  const onUserChangeCallback = useCallback((userId: string) => {
    const isMember = userId ? memberIdsRef.current.includes(userId) : false;
    const isPending = userId ? pendingUserIdsRef.current.includes(userId) : false;
    setCanSubmit(!!userId && !isMember && !isPending);
    setAlreadyMember(isMember);
    setHasPendingInvite(isPending);
  }, []);

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
        <div className="flex gap-24">
          <RadioButton
            id={`role-admin-${openKey}`}
            name={`role-${openKey}`}
            value="admin"
            label="Administrador"
            checked={selectedRole === "admin"}
            onChange={() => setSelectedRole("admin")}
          />
          <RadioButton
            id={`role-editor-${openKey}`}
            name={`role-${openKey}`}
            value="editor"
            label="Editor"
            checked={selectedRole === "editor"}
            onChange={() => setSelectedRole("editor")}
          />
        </div>
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

interface RemoveMemberPopupProps {
  orgId: string;
  member: OrganizationMember;
  onMemberRemoved: () => void;
}

function RemoveMemberPopupContent({ orgId, member, onMemberRemoved }: RemoveMemberPopupProps) {
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

interface EditRolePopupProps {
  orgId: string;
  member: OrganizationMember;
  onRoleUpdated: () => void;
  openKey: number;
}

function EditRolePopupContent({ orgId, member, onRoleUpdated, openKey }: EditRolePopupProps) {
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
        <div className="flex gap-16">
          <RadioButton
            id="role-admin"
            name={`role-${openKey}`}
            value="admin"
            label="Administrador"
            checked={selectedRole === "admin"}
            onChange={() => setSelectedRole("admin")}
          />
          <RadioButton
            id="role-editor"
            name={`role-${openKey}`}
            value="editor"
            label="Editor"
            checked={selectedRole === "editor"}
            onChange={() => setSelectedRole("editor")}
          />
        </div>
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

interface RefuseMembershipPopupProps {
  orgId: string;
  request: MembershipRequest;
  onRefused: () => void;
}

function RefuseMembershipPopupContent({ orgId, request, onRefused }: RefuseMembershipPopupProps) {
  const { hide } = usePopupContext();
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRefuse = async () => {
    setIsSubmitting(true);
    try {
      await refuseMembership(orgId, request.id, comment);
      onRefused();
      hide();
    } catch (error) {
      console.error("Error refusing membership:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-24"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void handleRefuse();
      }}
    >
      <p className="text-neutral-900">
        Recusar o pedido de adesão de{" "}
        <strong>
          {request.user.first_name} {request.user.last_name}
        </strong>
        ?
      </p>

      <InputTextArea
        label="Motivo da recusa"
        id="refuse-comment"
        rows={3}
        placeholder="Indique o motivo da recusa (opcional)"
        value={comment}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setComment(event.target.value)}
      />

      <div className="flex gap-16">
        <Button type="button" appearance="outline" variant="primary" onClick={() => hide()}>
          Cancelar
        </Button>
        <Button type="submit" variant="danger" disabled={isSubmitting}>
          {isSubmitting ? "A recusar..." : "Recusar"}
        </Button>
      </div>
    </form>
  );
}

interface MembersClientProps {
  orgId?: string;
}

export default function MembersClient({ orgId }: MembersClientProps = {}) {
  const { show } = usePopupContext();
  const { user } = useAuth();
  const { activeOrg } = useActiveOrganization();
  const resolvedOrgId = orgId ?? activeOrg?.id;
  const cachedOrgName = useOrganizationName(resolvedOrgId, user?.organizations);
  const [addMemberOpenKey, setAddMemberOpenKey] = useState(0);
  const [editMemberOpenKey, setEditMemberOpenKey] = useState(0);
  const [viewedOrg, setViewedOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<MembershipRequest[]>([]);
  const [, setIsLoading] = useState(false);
  const [requestAction, setRequestAction] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    sortField,
    sortOrder,
    handleSort,
    getSortOrder,
  } = useAdminListController<MemberSortField>({
    initialFilters: {},
  });

  const loadMembers = useCallback(async () => {
    if (!resolvedOrgId) return;

    setIsLoading(true);
    try {
      const orgData = await fetchOrganization(resolvedOrgId);
      setViewedOrg(orgData);
      setMembers(orgData?.members || []);
    } catch (error) {
      console.error("Error loading members:", error);
    } finally {
      setIsLoading(false);
    }

    try {
      const requests = await fetchMembershipRequests(resolvedOrgId);
      setPendingRequests(
        requests.filter((request: MembershipRequest) => request.status === "pending")
      );
    } catch {
      setPendingRequests([]);
    }
  }, [resolvedOrgId]);

  useEffect(() => {
    if (!resolvedOrgId) return;

    let isCancelled = false;

    const loadCurrentMembers = async () => {
      if (isCancelled) return;
      await loadMembers();
    };

    void loadCurrentMembers();

    return () => {
      isCancelled = true;
    };
  }, [resolvedOrgId, loadMembers]);

  const handleAcceptRequest = async (request: MembershipRequest) => {
    setRequestAction(request.id);
    setRequestError(null);
    try {
      await acceptMembership(resolvedOrgId!, request.id);
      await loadMembers();
    } catch (error) {
      console.error("Error accepting membership:", error);
      const message = error instanceof Error ? error.message : null;
      setRequestError(message || "Ocorreu um erro ao aceitar o pedido. Tente novamente.");
    } finally {
      setRequestAction(null);
    }
  };

  const handleRefuseRequest = useCallback(
    (request: MembershipRequest) => {
      show(
        <RefuseMembershipPopupContent
          orgId={resolvedOrgId!}
          request={request}
          onRefused={loadMembers}
        />,
        {
          title: "Recusar pedido de adesão",
          closeAriaLabel: "Fechar",
          dimensions: "m",
        }
      );
    },
    [loadMembers, resolvedOrgId, show]
  );

  const handleRemoveMember = useCallback(
    (member: OrganizationMember) => {
      show(
        <RemoveMemberPopupContent
          orgId={resolvedOrgId!}
          member={member}
          onMemberRemoved={loadMembers}
        />,
        {
          title: "Eliminar membro",
          closeAriaLabel: "Fechar",
          dimensions: "m",
        }
      );
    },
    [loadMembers, resolvedOrgId, show]
  );

  const handleEditRole = useCallback(
    (member: OrganizationMember) => {
      const nextKey = editMemberOpenKey + 1;
      setEditMemberOpenKey(nextKey);
      show(
        <EditRolePopupContent
          orgId={resolvedOrgId!}
          member={member}
          onRoleUpdated={loadMembers}
          openKey={nextKey}
        />,
        {
          title: "Editar papel do membro",
          closeAriaLabel: "Fechar",
          dimensions: "m",
        }
      );
    },
    [editMemberOpenKey, loadMembers, resolvedOrgId, show]
  );

  // Whether the current user may manage members — decided by the backend.
  // viewedOrg is fetched client-side with the session, so permissions.members
  // reflects this user (sysadmin or org admin).
  const isOrgAdmin = useMemo(() => viewedOrg?.permissions?.members ?? false, [viewedOrg]);

  const sortedMembers = useMemo(
    () => sortMembers(members, sortField, sortOrder),
    [members, sortField, sortOrder]
  );

  const paginatedMembers = useMemo(
    () => paginateItems(sortedMembers, currentPage, pageSize),
    [sortedMembers, currentPage, pageSize]
  );

  const columns = useMemo(
    () =>
      createMemberColumns({
        isOrgAdmin,
        onEditRole: handleEditRole,
        onRemoveMember: handleRemoveMember,
      }),
    [handleEditRole, handleRemoveMember, isOrgAdmin]
  );

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: cachedOrgName || viewedOrg?.name || "Organização", url: "#" },
        { label: "Membros" },
      ]}
      title="Membros"
    >
      {isOrgAdmin && pendingRequests.length > 0 && (
        <div className="mb-32">
          <h2 className="mb-16 text-base font-semibold text-neutral-900">
            Pedidos de adesão pendentes ({pendingRequests.length})
          </h2>
          {requestError && (
            <div className="mb-16">
              <StatusCard variant="danger" showIcon description={requestError} />
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Utilizador</TableHeaderCell>
                <TableHeaderCell>Comentário</TableHeaderCell>
                <TableHeaderCell>Data do pedido</TableHeaderCell>
                <TableHeaderCell>Ações</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell headerLabel="Utilizador">
                    <div className="flex items-center gap-8">
                      {request.user.avatar_thumbnail ? (
                        <img
                          src={request.user.avatar_thumbnail}
                          alt={`${request.user.first_name} ${request.user.last_name}`}
                          className="h-32 w-32 rounded-full"
                        />
                      ) : (
                        <Icon name="agora-line-user" className="h-32 w-32" />
                      )}
                      <TextLink href={`/pages/users/${request.user.slug}`}>
                        {request.user.first_name} {request.user.last_name}
                      </TextLink>
                    </div>
                  </TableCell>
                  <TableCell headerLabel="Comentário">{request.comment || "-"}</TableCell>
                  <TableCell headerLabel="Data do pedido">
                    {formatDateToDMY(request.created)}
                  </TableCell>
                  <TableCell headerLabel="Ações">
                    <div className="flex gap-8">
                      <Button
                        variant="primary"
                        appearance="link"
                        onClick={() => handleAcceptRequest(request)}
                        disabled={requestAction === request.id}
                      >
                        <span className="underline">
                          {requestAction === request.id ? "A aceitar..." : "Aceitar"}
                        </span>
                      </Button>
                      <Button
                        variant="danger"
                        appearance="link"
                        onClick={() => handleRefuseRequest(request)}
                        disabled={requestAction === request.id}
                      >
                        <span className="underline">Recusar</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="mb-24 flex items-center justify-between">
        <p className="text-sm font-semibold uppercase text-neutral-700">
          {members.length} {members.length === 1 ? "membro" : "membros"}
        </p>
        {isOrgAdmin && (
          <Button
            variant="primary"
            appearance="outline"
            hasIcon
            leadingIcon="agora-line-plus-circle"
            leadingIconHover="agora-solid-plus-circle"
            onClick={() => {
              const nextKey = addMemberOpenKey + 1;
              setAddMemberOpenKey(nextKey);
              show(
                <AddMemberPopupContent
                  orgId={resolvedOrgId!}
                  onMemberAdded={loadMembers}
                  openKey={nextKey}
                />,
                {
                  title: "Adicionar um membro à organização",
                  closeAriaLabel: "Fechar",
                  dimensions: "m",
                }
              );
            }}
          >
            Adicionar um membro
          </Button>
        )}
      </div>

      <AdminPaginatedTable
        pageSize={pageSize}
        totalItems={members.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        setPageSize={setPageSize}
      >
        <AdminListTable
          items={paginatedMembers}
          columns={columns}
          getSortOrder={getSortOrder}
          handleSort={handleSort}
          getRowKey={(member) => member.user.id}
        />
      </AdminPaginatedTable>
    </AdminLayout>
  );
}
