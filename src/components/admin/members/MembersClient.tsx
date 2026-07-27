"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, usePopupContext } from "@ama-pt/agora-design-system";
import { acceptMembership } from "@/service/api/organizations";
import type { MembershipRequest, OrganizationMember } from "@/service/types/identity";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useOrganizationName } from "@/hooks/useOrganizationName";
import { useAuth } from "@/context/AuthContext";
import AdminLayout from "@/components/Layout/AdminLayout";
import AdminPaginatedTable from "@/components/admin/lists/AdminPaginatedTable";
import AdminListTable from "@/components/admin/lists/AdminListTable";
import { paginateItems } from "@/utils/admin-lists/listHelpers";
import { useAdminListController } from "@/hooks/admin-lists/useAdminListController";
import { createMemberColumns, sortMembers, type MemberSortField } from "./membersListConfig";
import { useMembersData } from "./hooks/useMembersData";
import { PendingRequestsTable } from "./PendingRequestsTable";
import { AddMemberPopupContent } from "./popups/AddMemberPopupContent";
import { EditRolePopupContent } from "./popups/EditRolePopupContent";
import { RemoveMemberPopupContent } from "./popups/RemoveMemberPopupContent";
import { RefuseMembershipPopupContent } from "./popups/RefuseMembershipPopupContent";
import type { BoMembersPage } from "@/service/types/admin/members";

interface MembersClientProps {
  orgId?: string;
  pageContent: BoMembersPage;
}

export default function MembersClient({ orgId, pageContent }: MembersClientProps) {
  const { t } = useTranslation(["admin-common", "admin-members"]);
  const { show } = usePopupContext();
  const { user } = useAuth();
  const { activeOrg } = useActiveOrganization();
  const resolvedOrgId = orgId ?? activeOrg?.id;
  const cachedOrgName = useOrganizationName(resolvedOrgId, user?.organizations);
  const [addMemberOpenKey, setAddMemberOpenKey] = useState(0);
  const [editMemberOpenKey, setEditMemberOpenKey] = useState(0);
  const [requestAction, setRequestAction] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const { viewedOrg, members, pendingRequests, reload } = useMembersData(resolvedOrgId);
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

  const handleAcceptRequest = async (request: MembershipRequest) => {
    setRequestAction(request.id);
    setRequestError(null);
    try {
      await acceptMembership(resolvedOrgId!, request.id);
      await reload();
    } catch (error) {
      console.error("Error accepting membership:", error);
      const message = error instanceof Error ? error.message : null;
      setRequestError(message || t("admin-members:requestError"));
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
          onRefused={reload}
        />,
        {
          title: t("admin-members:popups.refuseTitle"),
          closeAriaLabel: t("admin-common:deleteAccount.closeAriaLabel"),
          dimensions: "m",
        }
      );
    },
    [reload, resolvedOrgId, show, t]
  );

  const handleRemoveMember = useCallback(
    (member: OrganizationMember) => {
      show(
        <RemoveMemberPopupContent
          orgId={resolvedOrgId!}
          member={member}
          onMemberRemoved={reload}
        />,
        {
          title: t("admin-members:popups.removeTitle"),
          closeAriaLabel: t("admin-common:deleteAccount.closeAriaLabel"),
          dimensions: "m",
        }
      );
    },
    [reload, resolvedOrgId, show, t]
  );

  const handleEditRole = useCallback(
    (member: OrganizationMember) => {
      const nextKey = editMemberOpenKey + 1;
      setEditMemberOpenKey(nextKey);
      show(
        <EditRolePopupContent
          orgId={resolvedOrgId!}
          member={member}
          onRoleUpdated={reload}
          openKey={nextKey}
        />,
        {
          title: t("admin-members:popups.editRoleTitle"),
          closeAriaLabel: t("admin-common:deleteAccount.closeAriaLabel"),
          dimensions: "m",
        }
      );
    },
    [editMemberOpenKey, reload, resolvedOrgId, show, t]
  );

  const handleOpenAddMember = useCallback(() => {
    const nextKey = addMemberOpenKey + 1;
    setAddMemberOpenKey(nextKey);
    show(
      <AddMemberPopupContent orgId={resolvedOrgId!} onMemberAdded={reload} openKey={nextKey} />,
      {
        title: t("admin-members:popups.addTitle"),
        closeAriaLabel: t("admin-common:deleteAccount.closeAriaLabel"),
        dimensions: "m",
      }
    );
  }, [addMemberOpenKey, reload, resolvedOrgId, show, t]);

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
        labels: {
          member: t("admin-members:columns.member"),
          role: t("admin-members:columns.role"),
          since: t("admin-members:columns.since"),
          actions: t("admin-members:columns.actions"),
          editRole: t("admin-members:columns.editRole"),
          removeMember: t("admin-members:columns.removeMember"),
          adminRole: t("admin-members:roles.admin"),
          editorRole: t("admin-members:roles.editor"),
        },
        onEditRole: handleEditRole,
        onRemoveMember: handleRemoveMember,
      }),
    [handleEditRole, handleRemoveMember, isOrgAdmin, t]
  );

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: t("admin-common:breadcrumbs.administration"), url: "/admin" },
        {
          label: cachedOrgName || viewedOrg?.name || t("admin-members:organizationFallback"),
          url: "#",
        },
        { label: t("admin-members:breadcrumbs.members") },
      ]}
      title={pageContent.orgHero?.title ?? ""}
    >
      {isOrgAdmin && pendingRequests.length > 0 && (
        <PendingRequestsTable
          requests={pendingRequests}
          requestAction={requestAction}
          requestError={requestError}
          onAccept={handleAcceptRequest}
          onRefuse={handleRefuseRequest}
        />
      )}

      <div className="mb-24 flex items-center justify-between">
        <p className="text-sm font-semibold uppercase text-neutral-700">
          {t("admin-members:count", { count: members.length })}
        </p>
        {isOrgAdmin && (
          <Button
            variant="primary"
            appearance="outline"
            hasIcon
            leadingIcon="agora-line-plus-circle"
            leadingIconHover="agora-solid-plus-circle"
            onClick={handleOpenAddMember}
          >
            {t("admin-members:addMember")}
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
