"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  CardNoResults,
  Icon,
  InputSearchBar,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import { fetchOrganizations, deleteOrganization } from "@/app/api/organizations";
import type { Organization } from '@/service/types/identity';
import { createPaginationProps } from "@/utils/createPaginationProps";
import TextLink from "@/components/Primitives/TextLink";
import ResultsCount from "../ResultsCount";
import TableActionsCell from "../TableActionsCell";
import AdminLayout from "@/components/Layout/AdminLayout";

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
type SortOrder = "ascending" | "descending" | "none";

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
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    void (async () => {
      await loadData();
    })();
  }, [loadData]);

  const handleSearch = (value: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearchQuery(value);
      setCurrentPage(1);
    }, 400);
  };

  const handleSort = (field: SortField) => (newOrder: SortOrder) => {
    setSortField(newOrder === "none" ? null : field);
    setSortOrder(newOrder);
    setCurrentPage(1);
  };

  const getSortOrder = (field: SortField): SortOrder => {
    return sortField === field ? sortOrder : "none";
  };

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
    <AdminLayout breadcrumbItems={[
      { label: "Administração", url: "/pages/admin" },
      { label: "Sistema", url: "#" },
      { label: "Organizações", url: "/pages/admin/system/organizations" },
    ]}
      title="Organizações"
    >
      <ResultsCount count={totalItems} isLoading={isLoading} />

      <div className="mb-24 flex items-end gap-16">
        <div className="admin-search-wrapper">
          <InputSearchBar
            hasVoiceActionButton={false}
            label="Pesquisar"
            placeholder="Pesquise o nome da organização"
            aria-label="Pesquisar organizações"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              handleSearch(e.target.value);
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-neutral-700">A carregar...</p>
      ) : organizations.length > 0 ? (
        <Table
          paginationProps={createPaginationProps(
            pageSize,
            totalItems,
            currentPage,
            setCurrentPage,
            setPageSize
          )}
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
        </Table>
      ) : (
        <CardNoResults
          position="center"
          icon={<Icon name="agora-line-building" className="icon-xl h-12 w-12 text-primary-500" />}
          title="Sem organizações"
          description="Nenhuma organização encontrada."
          hasAnchor={false}
        />
      )}
    </AdminLayout>
  );
}
