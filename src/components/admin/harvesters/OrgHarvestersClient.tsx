"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Breadcrumb,
  CardNoResults,
  Icon,
  InputSelect,
  InputSearchBar,
  DropdownSection,
  DropdownOption,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import StatusDot from "@/components/admin/StatusDot";
import { fetchOrgHarvesters } from "@/services/api";
import { HarvestSource } from "@/types/api";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useOrganizationName } from "@/hooks/useOrganizationName";
import { useAuth } from "@/context/AuthContext";
import PublishDropdown from "@/components/admin/PublishDropdown";

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};

const getStatusLabel = (source: HarvestSource) => {
  const job = source.last_job;
  if (!job) return "Sem execução";
  if (job.status === "done") return "Terminado";
  if (job.status === "failed") return "Falhado";
  if (job.status === "started") return "Em execução";
  return job.status;
};

const getStatusVariant = (source: HarvestSource) => {
  const job = source.last_job;
  if (!job) return "informative" as const;
  if (job.status === "done") return "success" as const;
  if (job.status === "failed") return "danger" as const;
  return "warning" as const;
};

export default function OrgHarvestersClient() {
  const params = useParams();
  const orgIdFromUrl = params?.orgId as string | undefined;
  const { activeOrg, isLoading: isOrgLoading, selectOrganization } = useActiveOrganization();

  const orgId = orgIdFromUrl || activeOrg?.id;
  const { user } = useAuth();
  const orgName = useOrganizationName(orgId, user?.organizations);

  const [harvesters, setHarvesters] = useState<HarvestSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (orgIdFromUrl && activeOrg?.id !== orgIdFromUrl) {
      selectOrganization(orgIdFromUrl);
    }
  }, [orgIdFromUrl, activeOrg?.id, selectOrganization]);

  useEffect(() => {
    if (!orgId) {
      setIsLoading(false);
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

  const paginatedHarvesters = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return harvesters.slice(start, start + itemsPerPage);
  }, [harvesters, currentPage, itemsPerPage]);

  if (!isOrgLoading && !orgId) {
    return (
      <div className="admin-page">
        <CardNoResults
          className="datasets-page__empty"
          position="center"
          icon={
            <Icon name="agora-line-buildings" className="w-12 h-12 text-primary-500 icon-xl" />
          }
          title="Sem organizações"
          description="Não pertence a nenhuma organização."
          hasAnchor={false}
        />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: orgName || activeOrg?.name || "Organização", url: "#" },
            { label: "Harvesters", url: "/pages/admin/org/harvesters" },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">Harvesters</h1>
        <PublishDropdown />
      </div>

      <p className="text-neutral-700 text-sm mb-[16px]">
        {harvesters.length} resultados
      </p>

      <div className="flex items-end gap-[16px] mb-[24px]">
        <div className="admin-search-wrapper">
          <InputSearchBar hasVoiceActionButton={false}
            label="Pesquisar"
            placeholder="Pesquise o nome do harvester"
            aria-label="Pesquisar harvesters"
          />
        </div>
        <InputSelect
          label=""
          hideLabel
          placeholder="Filtrar por estado"
          id="filter-status"
        >
          <DropdownSection name="status">
            <DropdownOption value="public">Público</DropdownOption>
            <DropdownOption value="archived">Arquivo</DropdownOption>
            <DropdownOption value="draft">Rascunho</DropdownOption>
            <DropdownOption value="deleted">Excluído</DropdownOption>
          </DropdownSection>
        </InputSelect>
      </div>

      {isLoading ? (
        <p>A carregar...</p>
      ) : harvesters.length > 0 ? (
        <>
          <Table
            paginationProps={{
              itemsPerPageLabel: "Linhas por página",
              itemsPerPage,
              totalItems: harvesters.length,
              availablePageSizes: [5, 10, 20],
              currentPage: currentPage - 1,
              buttonDropdownAriaLabel: "Selecionar linhas por página",
              dropdownListAriaLabel: "Opções de linhas por página",
              prevButtonAriaLabel: "Página anterior",
              nextButtonAriaLabel: "Próxima página",
              onPageChange: (page: number) => setCurrentPage(page + 1),
              onItemsPerPageChange: (size: number) => {
                setItemsPerPage(size);
                setCurrentPage(1);
              },
            }}
          >
            <TableHeader>
              <TableRow>
                <TableHeaderCell sortType="date" sortOrder="none">
                  Nome
                </TableHeaderCell>
                <TableHeaderCell>Estado</TableHeaderCell>
                <TableHeaderCell>Implementação</TableHeaderCell>
                <TableHeaderCell sortType="date" sortOrder="none">
                  Criado em
                </TableHeaderCell>
                <TableHeaderCell sortType="date" sortOrder="none">
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
                    <a
                      href={`/pages/admin/org/harvesters/${harvester.id}`}
                      className="text-primary-600 underline"
                    >
                      {harvester.name}
                    </a>
                  </TableCell>
                  <TableCell headerLabel="Estado">
                    <StatusDot variant={getStatusVariant(harvester)}>
                      {getStatusLabel(harvester)}
                    </StatusDot>
                  </TableCell>
                  <TableCell headerLabel="Implementação">
                    {harvester.backend}
                  </TableCell>
                  <TableCell headerLabel="Criado em">
                    {formatDate(harvester.created_at)}
                  </TableCell>
                  <TableCell headerLabel="Última execução">
                    {harvester.last_job
                      ? formatDate(harvester.last_job.started ?? harvester.last_job.ended ?? "")
                      : "Ainda não"}
                  </TableCell>
                  <TableCell headerLabel="Conjuntos de dados">
                    {harvester.datasets_count ?? 0}
                  </TableCell>
                  <TableCell headerLabel="API">
                    {harvester.backend}
                  </TableCell>
                  <TableCell headerLabel="Ações">
                    <a href={`/pages/admin/harvesters/${harvester.id}`}>
                      <Icon name="agora-line-edit" className="w-[20px] h-[20px]" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      ) : (
        <div className="datasets-page__body">
          <div className="datasets-page__content">
            <CardNoResults
              className="datasets-page__empty"
              position="center"
              icon={
                <Icon name="agora-line-buildings" className="w-12 h-12 text-primary-500 icon-xl" />
              }
              title="Sem harvesters"
              description="A organização ainda não tem harvesters."
              hasAnchor={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
