"use client";

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
import StatusDot from "@/components/admin/StatusDot";
import {
  fetchOrganization,
  addMember,
  updateMemberRole,
  removeMember,
  fetchMembershipRequests,
  acceptMembership,
  refuseMembership,
} from "@/app/api/organizations";
import { suggestUsers } from "@/app/api/search";
import type {
  MembershipRequest,
  Organization,
  OrganizationMember,
  UserSuggestion,
} from '@/service/types/identity';
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useOrganizationName } from "@/hooks/useOrganizationName";
import { useAuth } from "@/context/AuthContext";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import AdminLayout from "@/components/Layout/AdminLayout";
import { formatDateToDMY } from "@/utils/formatDate";
import TextLink from "@/components/Primitives/TextLink";
import { createPaginationProps } from "@/utils/createPaginationProps";

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  editor: "Editor",
};

const rolePillVariant = (role: string) => {
  switch (role) {
    case "admin":
      return "informative" as const;
    case "editor":
      return "success" as const;
    default:
      return "neutral" as const;
  }
};

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
  const canSubmitRef = useRef(false);
  const [, forceUpdate] = useState(0);
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
        memberIdsRef.current = (org?.members || []).map((m: OrganizationMember) => m.user.id);
        pendingUserIdsRef.current = requests
          .filter((r: MembershipRequest) => r.status === "pending" && r.user)
          .map((r: MembershipRequest) => r.user.id);
      } catch (error) {
        console.error("Error loading users:", error);
      }
    }
    loadData();
  }, [orgId]);

  // Debounced backend search while the user types in the dropdown input.
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await suggestUsers(q, 50);
        setSearchResults(res);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const userDropdownChildren = useMemo(() => {
    // When searching show only backend matches; otherwise show the initial list.
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
    if (!canSubmitRef.current) return;
    setAddError(null);
    try {
      await addMember(orgId, selectedUserIdRef.current, selectedRole);
      onMemberAdded();
      hide();
    } catch (error) {
      console.error("Error adding member:", error);
      const msg = error instanceof Error ? error.message : null;
      setAddError(msg || "Ocorreu um erro ao adicionar o membro. Tente novamente.");
    }
  };

  const onUserChangeCallback = useCallback((userId: string) => {
    const isMember = userId ? memberIdsRef.current.includes(userId) : false;
    const isPending = userId ? pendingUserIdsRef.current.includes(userId) : false;
    canSubmitRef.current = !!userId && !isMember && !isPending;
    setAlreadyMember(isMember);
    setHasPendingInvite(isPending);
    forceUpdate((n) => n + 1);
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
        <Button variant="primary" onClick={handleAdd} disabled={!canSubmitRef.current}>
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
    <div className="flex flex-col gap-24">
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
        <Button appearance="outline" variant="primary" onClick={() => hide()}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          hasIcon
          trailingIcon="agora-line-check-circle"
          trailingIconHover="agora-solid-check-circle"
          onClick={handleUpdate}
        >
          Guardar
        </Button>
      </div>
    </div>
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
    <div className="flex flex-col gap-24">
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
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
      />

      <div className="flex gap-16">
        <Button appearance="outline" variant="primary" onClick={() => hide()}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={handleRefuse} disabled={isSubmitting}>
          {isSubmitting ? "A recusar..." : "Recusar"}
        </Button>
      </div>
    </div>
  );
}

type SortOrder = "none" | "ascending" | "descending";
type MemberSortField = "name" | "since";

interface MembersClientProps {
  orgId?: string;
}

export default function MembersClient({ orgId }: MembersClientProps = {}) {
  const { show } = usePopupContext();
  const { user, isAdmin } = useAuth();
  const { activeOrg } = useActiveOrganization();
  // Prefer the orgId from the URL params (passed by the server page). Fall
  // back to the sidebar's active organization when this component is used
  // in contexts that don't have an org in the URL.
  const resolvedOrgId = orgId ?? activeOrg?.id;
  // Synchronous name lookup (no network) so the breadcrumb is populated
  // immediately on first render.
  const cachedOrgName = useOrganizationName(resolvedOrgId, user?.organizations);
  const [addMemberOpenKey, setAddMemberOpenKey] = useState(0);
  const [editMemberOpenKey, setEditMemberOpenKey] = useState(0);
  const [viewedOrg, setViewedOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<MembershipRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [requestAction, setRequestAction] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<MemberSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");

  const handleSort = (field: MemberSortField) => (newOrder: SortOrder) => {
    setSortField(newOrder === "none" ? null : field);
    setSortOrder(newOrder);
    setCurrentPage(1);
  };

  const getSortOrder = (field: MemberSortField): SortOrder =>
    sortField === field ? sortOrder : "none";

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
      setPendingRequests(requests.filter((r: MembershipRequest) => r.status === "pending"));
    } catch {
      setPendingRequests([]);
    }
  }, [resolvedOrgId]);

  useEffect(() => {
    if (!resolvedOrgId) {
      setIsLoading(false);
      return;
    }
    loadMembers();
  }, [resolvedOrgId, loadMembers]);

  const handleAcceptRequest = async (request: MembershipRequest) => {
    setRequestAction(request.id);
    setRequestError(null);
    try {
      await acceptMembership(resolvedOrgId!, request.id);
      await loadMembers();
    } catch (error) {
      console.error("Error accepting membership:", error);
      const msg = error instanceof Error ? error.message : null;
      setRequestError(msg || "Ocorreu um erro ao aceitar o pedido. Tente novamente.");
    } finally {
      setRequestAction(null);
    }
  };

  const handleRefuseRequest = (request: MembershipRequest) => {
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
  };

  const handleRemoveMember = (member: OrganizationMember) => {
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
  };

  const isOrgAdmin = useMemo(
    () =>
      isAdmin ||
      (viewedOrg?.members?.some((m) => m.user.id === user?.id && m.role === "admin") ?? false),
    [isAdmin, viewedOrg, user],
  );

  const sortedMembers = useMemo(() => {
    if (!sortField || sortOrder === "none") return members;
    const dir = sortOrder === "ascending" ? 1 : -1;
    const collator = new Intl.Collator("pt", { sensitivity: "base" });
    return [...members].sort((a, b) => {
      if (sortField === "name") {
        const an = `${a.user.first_name ?? ""} ${a.user.last_name ?? ""}`.trim();
        const bn = `${b.user.first_name ?? ""} ${b.user.last_name ?? ""}`.trim();
        return collator.compare(an, bn) * dir;
      }
      // since
      const at = a.since ? Date.parse(a.since) : 0;
      const bt = b.since ? Date.parse(b.since) : 0;
      return (at - bt) * dir;
    });
  }, [members, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedMembers.length / itemsPerPage);
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedMembers.slice(start, start + itemsPerPage);
  }, [sortedMembers, currentPage, itemsPerPage]);

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
            hasIcon={true}
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

      <Table
        paginationProps={createPaginationProps(
          itemsPerPage,
          members.length,
          currentPage,
          setCurrentPage,
          setItemsPerPage
        )}
      >
        <TableHeader>
          <TableRow>
            <TableHeaderCell
              sortType="numeric"
              sortOrder={getSortOrder("name")}
              onSortChange={handleSort("name")}
            >
              Membros
            </TableHeaderCell>
            <TableHeaderCell>Estatuto</TableHeaderCell>
            <TableHeaderCell
              sortType="date"
              sortOrder={getSortOrder("since")}
              onSortChange={handleSort("since")}
            >
              Membro desde
            </TableHeaderCell>
            {isOrgAdmin ? <TableHeaderCell>Ações</TableHeaderCell> : <></>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedMembers.map((member) => (
            <TableRow key={member.user.id}>
              <TableCell headerLabel="Membros">
                <div className="flex items-center gap-8">
                  {member.user.avatar_thumbnail ? (
                    <img
                      src={member.user.avatar_thumbnail}
                      alt={`${member.user.first_name} ${member.user.last_name}`}
                      className="h-32 w-32 rounded-full"
                    />
                  ) : (
                    <Icon name="agora-line-user" className="h-32 w-32" />
                  )}
                  <div>
                    <TextLink href={`/pages/users/${member.user.slug}`}>
                      {member.user.first_name} {member.user.last_name}
                    </TextLink>
                  </div>
                </div>
              </TableCell>
              <TableCell headerLabel="Estatuto">
                <StatusDot variant={rolePillVariant(member.role)}>
                  {roleLabels[member.role] || member.role}
                </StatusDot>
              </TableCell>
              <TableCell headerLabel="Membro desde">{formatDateToDMY(member.since)}</TableCell>
              {isOrgAdmin ? (
                <TableCell headerLabel="Ações">
                  <div className="flex gap-8">
                    <button
                      onClick={() => {
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
                      }}
                      title="Editar papel"
                    >
                      <Icon
                        name="agora-line-edit"
                        className="h-[20px] w-[20px] cursor-pointer text-primary-600"
                      />
                    </button>
                    <button onClick={() => handleRemoveMember(member)} title="Remover membro">
                      <Icon
                        name="agora-line-trash"
                        className="h-[20px] w-[20px] cursor-pointer text-danger-600"
                      />
                    </button>
                  </div>
                </TableCell>
              ) : (
                <></>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </AdminLayout>
  );
}
