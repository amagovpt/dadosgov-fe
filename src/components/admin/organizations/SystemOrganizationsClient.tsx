"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Button,
  CardNoResults,
  Icon,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { fetchOrganizations, deleteOrganization } from "@/services/api";
import { Organization } from "@/types/api";
import TextLink from "@/components/Primitives/TextLink";
import { SortOrder, useSortControls } from "@/components/admin/lists/useClientTableState";
import { useDebouncedSearch } from "@/components/admin/lists/useDebouncedSearch";
import TableActionsCell from "../TableActionsCell";

function DeleteOrgPopupContent({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-col gap-16">
      <p>Esta ação é irreversível.</p>
      <div className="flex justify-end gap-16 pt-16">
        <Button appearance="outline" variant="neutral" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          hasIcon
          leadingIcon="agora-line-trash"
          leadingIconHover="agora-solid-trash"
        >
          Eliminar
        </Button>
      </div>
    </div>
  );
}

type SortField = "name" | "created_at";

const SORT_FIELD_MAP: Record<SortField, string> = {
  name: "name",
  created_at: "created",
};

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

export default function SystemOrganizationsClient() {
  const { show, hide } = usePopupContext();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");
  const [deletingOrgId, setDeletingOrgId] = useState<string | null>(null);

  const { handleSort, getSortOrder } = useSortControls(
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    setCurrentPage
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiSort = sortField ? SORT_FIELD_MAP[sortField] : undefined;
      const sortParam =
        sortOrder === "none" || !apiSort
          ? undefined
          : `${sortOrder === "descending" ? "-" : ""}${apiSort}`;

      const response = await fetchOrganizations(currentPage, pageSize, {
        q: searchQuery.trim() || undefined,
        sort: sortParam,
      });
      setOrganizations(response.data || []);
      setTotalItems(response.total || 0);
    } catch (error) {
      console.error("Error loading organizations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, sortField, sortOrder]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSearch = useDebouncedSearch((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  });

  const handleDeleteOrg = (org: Organization) => {
    show(
      <DeleteOrgPopupContent
        onClose={hide}
        onConfirm={async () => {
          setDeletingOrgId(org.id);
          try {
            await deleteOrganization(org.id);
            hide();
            await loadData();
          } catch (error) {
            console.error("Error deleting organization:", error);
            hide();
          } finally {
            setDeletingOrgId(null);
          }
        }}
      />,
      {
        title: "Tem a certeza que quer eliminar esta organização?",
        closeAriaLabel: "Fechar",
        dimensions: "m",
      }
    );
  };

  return (
    <AdminListPage
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: "Sistema", url: "#" },
        { label: "Organizações", url: "/pages/admin/system/organizations" },
      ]}
      title="Organizações"
      isLoading={isLoading}
      count={totalItems}
      hasItems={organizations.length > 0}
      currentPage={currentPage}
      pageSize={pageSize}
      setCurrentPage={setCurrentPage}
      setPageSize={setPageSize}
      search={{
        placeholder: "Pesquise o nome da organização",
        ariaLabel: "Pesquisar organizações",
        onChange: handleSearch,
      }}
      emptyState={
        <CardNoResults
          position="center"
          icon={<Icon name="agora-line-building" className="icon-xl h-12 w-12 text-primary-500" />}
          title="Sem organizações"
          description="Nenhuma organização encontrada."
          hasAnchor={false}
        />
      }
    >
      <TableHeader>
        <TableRow>
          <TableHeaderCell
            sortType="numeric"
            sortOrder={getSortOrder("name")}
            onSortChange={handleSort("name")}
          >
            Nome
          </TableHeaderCell>
          <TableHeaderCell
            sortType="numeric"
            sortOrder={getSortOrder("created_at")}
            onSortChange={handleSort("created_at")}
          >
            Criado em
          </TableHeaderCell>
          <TableHeaderCell>Conjuntos de dados</TableHeaderCell>
          <TableHeaderCell>Reutilizações</TableHeaderCell>
          <TableHeaderCell>Membros</TableHeaderCell>
          <TableHeaderCell>Ações</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {organizations.map((org) => (
          <TableRow key={org.id}>
            <TableCell headerLabel="Nome">
              <TextLink href={`/pages/admin/org/${org.id}/profile`}>{org.name}</TextLink>
            </TableCell>
            <TableCell headerLabel="Criado em">{formatDate(org.created_at)}</TableCell>
            <TableCell headerLabel="Conjuntos de dados">{org.metrics?.datasets ?? 0}</TableCell>
            <TableCell headerLabel="Reutilizações">{org.metrics?.reuses ?? 0}</TableCell>
            <TableCell headerLabel="Membros">{org.members?.length ?? 0}</TableCell>
            <TableCell headerLabel="Ações">
              <TableActionsCell
                viewAction={{
                  href: `/pages/organizations/${org.slug}`,
                }}
                editAction={{
                  href: `/pages/admin/org/${org.id}/profile`,
                }}
                deleteAction={{
                  ariaLabel: `Eliminar ${org.name}`,
                  disabled: deletingOrgId === org.id,
                  handler: () => handleDeleteOrg(org),
                }}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </AdminListPage>
  );
}
