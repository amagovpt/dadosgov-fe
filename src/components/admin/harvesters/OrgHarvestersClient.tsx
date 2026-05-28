"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import StatusDot from "@/components/admin/StatusDot";
import AdminListPage from "@/components/admin/lists/AdminListPage";
import { fetchOrgHarvesters } from "@/services/api";
import type { HarvestSource } from "@/types/api";
import { getHarvesterStatus } from "@/utils/harvesterStatus";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useViewedOrganizationName } from "@/hooks/useViewedOrganization";
import { useAuth } from "@/context/AuthContext";
import { formatDateToDMY } from "@/utils/formatDate";
import TextLink from "@/components/Primitives/TextLink";
import AdminEmptyState from "../AdminEmptyState";
import StatusFilterSelect from "../StatusFilterSelect";
import TableActionsCell from "../TableActionsCell";
import { SortOrder, useSortControls } from "@/components/admin/lists/useClientTableState";

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
  const [itemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState<HarvesterSortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none");

  const { handleSort, getSortOrder } = useSortControls(
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    setCurrentPage
  );

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
    <AdminListPage
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: orgName || "Organização", url: "#" },
        { label: "Harvesters", url: "/pages/admin/org/harvesters" },
      ]}
      title="Harvesters"
      isLoading={isLoading}
      count={filteredHarvesters.length}
      currentPage={currentPage}
      pageSize={itemsPerPage}
      setCurrentPage={setCurrentPage}
      search={{
        placeholder: "Pesquise o nome do harvester",
        ariaLabel: "Pesquisar harvesters",
      }}
      filters={
        <StatusFilterSelect
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
        />
      }
      emptyState={
        <AdminEmptyState
          icon="agora-line-buildings"
          title="Sem harvesters"
          description="A organização ainda não tem harvesters."
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
        {paginatedHarvesters.map((harvester) => {
          const status = getHarvesterStatus(harvester);

          return (
            <TableRow key={harvester.id}>
              <TableCell headerLabel="Nome">
                <TextLink href={`/pages/admin/org/harvesters/${harvester.id}`}>
                  {harvester.name}
                </TextLink>
              </TableCell>
              <TableCell headerLabel="Estado">
                <StatusDot variant={status.variant}>{status.label}</StatusDot>
              </TableCell>
              <TableCell headerLabel="Implementação">{harvester.backend}</TableCell>
              <TableCell headerLabel="Criado em">{formatDateToDMY(harvester.created_at)}</TableCell>
              <TableCell headerLabel="Última execução">
                {harvester.last_job
                  ? formatDateToDMY(harvester.last_job.started ?? harvester.last_job.ended ?? "")
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
          );
        })}
      </TableBody>
    </AdminListPage>
  );
}
