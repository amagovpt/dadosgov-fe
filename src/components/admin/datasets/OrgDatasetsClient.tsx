"use client";

import { useParams } from "next/navigation";
import { Button, TableCell, TableHeaderCell, TableRow } from "@ama-pt/agora-design-system";
import { fetchOrgDatasets } from "@/service/api/organizations";
import { Dataset } from "@/service/types/dataset";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useAuth } from "@/context/AuthContext";
import { formatDateToDMY } from "@/utils/formatDate";
import { AdminResourceListPage, type ServerLoadParams } from "@/components/admin/AdminResourceListPage";
import { ResourceStatusBadge } from "@/components/admin/ResourceStatusBadge";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import TableActionsCell from "@/components/admin/TableActionsCell";
import TextLink from "@/components/Primitives/TextLink";

function buildStatusFilters(status: string) {
  if (status === "public") return { private: false, archived: false, deleted: false };
  if (status === "draft") return { private: true, archived: false, deleted: false };
  if (status === "archived") return { archived: true, deleted: false };
  if (status === "deleted") return { deleted: true };
  return {};
}

async function loadOrgDatasets(orgId: string, params: ServerLoadParams) {
  const { page, pageSize, query, status, sortField, sortOrder } = params;
  const sort =
    sortOrder === "none" ? "-created" : sortOrder === "ascending" ? sortField! : `-${sortField!}`;
  const filters: Record<string, unknown> = { sort, ...buildStatusFilters(status) };
  if (query) filters.q = query;
  const response = await fetchOrgDatasets(orgId, page, pageSize, filters);
  return { data: response.data ?? [], total: response.total ?? 0 };
}

function renderOrgDatasetRow(dataset: Dataset) {
  return (
    <TableRow key={dataset.id}>
      <TableCell headerLabel="Título">
        <TextLink href={`/pages/datasets/${dataset.slug}`}>{dataset.title}</TextLink>
      </TableCell>
      <TableCell headerLabel="Estado">
        <ResourceStatusBadge item={dataset} />
      </TableCell>
      <TableCell headerLabel="Criado em">{formatDateToDMY(dataset.created_at)}</TableCell>
      <TableCell headerLabel="Última modificação">
        <div>{formatDateToDMY(dataset.last_modified)}</div>
        {dataset.owner ? (
          <TextLink href={`/pages/users/${dataset.owner.slug}`} className="text-xs">
            {dataset.owner.first_name} {dataset.owner.last_name}
          </TextLink>
        ) : dataset.organization ? (
          <TextLink
            href={`/pages/organizations/${dataset.organization.slug}`}
            className="text-xs"
          >
            {dataset.organization.name}
          </TextLink>
        ) : null}
      </TableCell>
      <TableCell headerLabel="Ações">
        <TableActionsCell
          viewAction={{ href: `/pages/datasets/${dataset.slug}` }}
          editAction={{ href: `/pages/admin/org/datasets/edit?slug=${dataset.slug}` }}
        />
      </TableCell>
    </TableRow>
  );
}

interface OrgDatasetsClientProps {
  orgId?: string;
}

export default function OrgDatasetsClient({ orgId: propOrgId }: OrgDatasetsClientProps) {
  const params = useParams();
  const routeOrgId = (params?.orgId as string | undefined) ?? propOrgId;
  const { activeOrg, isLoading: isOrgLoading } = useActiveOrganization();
  const resolvedOrgId = routeOrgId ?? activeOrg?.id;
  const { user } = useAuth();
  const orgName = useViewedOrganizationName(resolvedOrgId, user?.organizations);

  if (!isOrgLoading && !resolvedOrgId) {
    return (
      <AdminEmptyState
        icon="agora-line-user-buildings"
        title="Sem organizações"
        description="Não pertence a nenhuma organização."
      />
    );
  }

  return (
    <AdminResourceListPage<Dataset>
      enabled={!!resolvedOrgId}
      defaultPageSize={50}
      defaultSortField="created"
      defaultSortOrder="descending"
      strategy={{
        mode: "server",
        load: (p) => loadOrgDatasets(resolvedOrgId!, p),
      }}
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: orgName || "Organização", url: "#" },
        { label: "Conjuntos de dados", url: "#" },
      ]}
      title="Conjuntos de dados"
      searchPlaceholder="Pesquise o nome, código ou sigla da entidade"
      toolbarExtra={
        <a href={`/api/1/organizations/${resolvedOrgId}/catalog`} download>
          <Button
            variant="primary"
            appearance="outline"
            hasIcon
            leadingIcon="agora-line-download"
            leadingIconHover="agora-solid-download"
          >
            Catálogo
          </Button>
        </a>
      }
      emptyState={{
        icon: "agora-line-edit",
        title: "Sem publicações",
        description: "A organização ainda não publicou conjuntos de dados.",
        createUrl: "/pages/admin/datasets/new",
      }}
      renderHeaders={(sort) => (
        <>
          <TableHeaderCell
            sortType="date"
            sortOrder={sort.getSortOrder("title")}
            onSortChange={sort.onSortChange("title")}
          >
            Título do conjunto de dados
          </TableHeaderCell>
          <TableHeaderCell>Estado</TableHeaderCell>
          <TableHeaderCell
            sortType="date"
            sortOrder={sort.getSortOrder("created")}
            onSortChange={sort.onSortChange("created")}
          >
            Criado em
          </TableHeaderCell>
          <TableHeaderCell
            sortType="date"
            sortOrder={sort.getSortOrder("last_update")}
            onSortChange={sort.onSortChange("last_update")}
          >
            Última modificação
          </TableHeaderCell>
          <TableHeaderCell>Ações</TableHeaderCell>
        </>
      )}
      renderRow={renderOrgDatasetRow}
    />
  );
}
