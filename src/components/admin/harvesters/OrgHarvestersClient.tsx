"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Icon,
  InputSearchBar,
  StatusCard,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import StatusDot from "@/components/admin/StatusDot";
import { fetchOrgHarvesters } from "@/services/api";
import type { HarvestSource } from "@/types/api";
import { getHarvesterStatus } from "@/utils/harvesterStatus";
import { HarvesterStatusFilter } from "./HarvesterStatusFilter";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import { createPaginationProps } from "@/utils/createPaginationProps";
import { formatDateToDMY } from "@/utils/formatDate";
import TextLink from "@/components/Primitives/TextLink";
import AdminEmptyState from "../AdminEmptyState";
import ResultsCount from "../ResultsCount";
import StatusFilterSelect from "../StatusFilterSelect";
import TableActionsCell from "../TableActionsCell";
import AdminLayout from "@/components/Layout/AdminLayout";


type SortOrder = "none" | "ascending" | "descending";
type HarvesterSortField = "name" | "created_at" | "last_job";

export default function OrgHarvestersClient() {
  const params = useParams();
  const orgIdFromUrl = params?.orgId as string | undefined;
  const { activeOrg, isLoading: isOrgLoading, selectOrganization } = useActiveOrganization();

  const orgId = orgIdFromUrl || activeOrg?.id;
  const { user } = useAuth();
  const orgName = useViewedOrganizationName(orgId, user?.organizations);

  const [harvesters, setHarvesters] = useState<HarvestSource[]>([]);
  const [isLoading, setIsLoading] = useState(() => !!orgId);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState<HarvesterSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");

  const handleSort = (field: HarvesterSortField) => (newOrder: SortOrder) => {
    setSortField(newOrder === "none" ? null : field);
    setSortOrder(newOrder);
    setCurrentPage(1);
  };

  const getSortOrder = (field: HarvesterSortField): SortOrder =>
    sortField === field ? sortOrder : "none";

  const lastJobTimestamp = (h: HarvestSource): number => {
    const j = h.last_job;
    if (!j) return 0;
    const v = j.started ?? j.ended ?? j.created;
    return v ? Date.parse(v) : 0;
  };

  useEffect(() => {
    if (orgIdFromUrl && activeOrg?.id !== orgIdFromUrl) {
      selectOrganization(orgIdFromUrl);
    }
  }, [orgIdFromUrl, activeOrg?.id, selectOrganization]);

  useEffect(() => {
    if (!orgId) {
      return;
    }
    async function loadHarvesters() {
      setIsLoading(true);
      try {
        const response = await fetchOrgHarvesters(orgId!, 1, 9999);
        setHarvesters(response.data || []);
      } catch (error) {
        console.error("Error loading org harvesters:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadHarvesters();
  }, [orgId]);

  const filteredHarvesters = useMemo(() => {
    if (!statusFilter) return harvesters;

    return harvesters.filter((h) => {
      if (statusFilter === "failed") {
        return h.last_job?.status === "failed";
      }
      if (statusFilter === "done") {
        return h.last_job?.status === "done";
      }
      const state = h.validation?.state ?? "pending";
      return state === statusFilter;
    });
  }, [harvesters, statusFilter]);

  const sortedHarvesters = useMemo(() => {
    if (!sortField || sortOrder === "none") return filteredHarvesters;
    const dir = sortOrder === "ascending" ? 1 : -1;
    const collator = new Intl.Collator("pt", { sensitivity: "base" });
    return [...filteredHarvesters].sort((a, b) => {
      if (sortField === "name") {
        return collator.compare(a.name ?? "", b.name ?? "") * dir;
      }
      if (sortField === "created_at") {
        const at = a.created_at ? Date.parse(a.created_at) : 0;
        const bt = b.created_at ? Date.parse(b.created_at) : 0;
        return (at - bt) * dir;
      }
      // last_job: prefer started, fall back to ended/created (matches the
      // value rendered in the cell)
      return (lastJobTimestamp(a) - lastJobTimestamp(b)) * dir;
    });
  }, [filteredHarvesters, sortField, sortOrder]);

  const paginatedHarvesters = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedHarvesters.slice(start, start + itemsPerPage);
  }, [sortedHarvesters, currentPage, itemsPerPage]);

  if (!isOrgLoading && !orgId) {
    return (
      <AdminEmptyState
        icon="agora-line-buildings"
        title="Sem organizações"
        description="Não pertence a nenhuma organização."
      />
    );
  }

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: orgName || "Organização", url: "#" },
        { label: "Harvesters", url: "/pages/admin/org/harvesters" },
      ]}
      title="Harvesters"
    >
      <ResultsCount count={harvesters.length} isLoading={isLoading} />

      <div className="mb-24 flex items-end gap-16">
        <div className="admin-search-wrapper">
          <InputSearchBar
            hasVoiceActionButton={false}
            label="Pesquisar"
            placeholder="Pesquise o nome do harvester"
            aria-label="Pesquisar harvesters"
          />
        </div>
        <StatusFilterSelect
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setCurrentPage(1);
          }}
        />
      </div>

      {isLoading ? (
        <p>A carregar...</p>
      ) : harvesters.length > 0 ? (
        <>
          <Table
            paginationProps={createPaginationProps(
              itemsPerPage,
              harvesters.length,
              currentPage,
              setCurrentPage,
              undefined
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
                <TableHeaderCell>Estado</TableHeaderCell>
                <TableHeaderCell>Implementação</TableHeaderCell>
                <TableHeaderCell
                  sortType="date"
                  sortOrder={getSortOrder("created_at")}
                  onSortChange={handleSort("created_at")}
                >
                  Criado em
                </TableHeaderCell>
                <TableHeaderCell
                  sortType="date"
                  sortOrder={getSortOrder("last_job")}
                  onSortChange={handleSort("last_job")}
                >
                  Última execução
                </TableHeaderCell>
                <TableHeaderCell>Conjuntos de dados</TableHeaderCell>
                <TableHeaderCell>API</TableHeaderCell>
                <TableHeaderCell>Ações</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedHarvesters.map((harvester, index) => (
                <TableRow key={index}>
                  <TableCell headerLabel="Nome">
                    <TextLink href={`/pages/admin/org/harvesters/${harvester.id}`}>
                      {harvester.name}
                    </TextLink>
                  </TableCell>
                  <TableCell headerLabel="Estado">
                    {(() => {
                      const status = getHarvesterStatus(harvester);
                      return <StatusDot variant={status.variant}>{status.label}</StatusDot>;
                    })()}
                  </TableCell>
                  <TableCell headerLabel="Implementação">{harvester.backend}</TableCell>
                  <TableCell headerLabel="Criado em">
                    {formatDateToDMY(harvester.created_at)}
                  </TableCell>
                  <TableCell headerLabel="Última execução">
                    {harvester.last_job
                      ? formatDateToDMY(
                        harvester.last_job.started ?? harvester.last_job.ended ?? ""
                      )
                      : "Ainda não"}
                  </TableCell>
                  <TableCell headerLabel="Conjuntos de dados">
                    {harvester.datasets_count ?? 0}
                  </TableCell>
                  <TableCell headerLabel="API">{harvester.backend}</TableCell>
                  <TableCell headerLabel="Ações">
                    <TableActionsCell
                      editAction={{
                        href: `/pages/admin/harvesters/${harvester.id}`,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      ) : (
        <AdminEmptyState
          icon="agora-line-buildings"
          title="Sem harvesters"
          description="A organização ainda não tem harvesters."
        />
      )}
    </AdminLayout>
  );
}
