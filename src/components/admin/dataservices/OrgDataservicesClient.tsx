"use client";

import { useEffect, useState } from "react";
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
  Button,
} from "@ama-pt/agora-design-system";
import StatusDot from "@/components/admin/StatusDot";
import { fetchOrgDataservices } from "@/services/api";
import { Dataservice } from "@/types/api";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { useOrganizationName } from "@/hooks/useOrganizationName";
import { useAuth } from "@/context/AuthContext";
import PublishDropdown from "@/components/admin/PublishDropdown";

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};

export default function OrgDataservicesClient() {
  const params = useParams();
  const routeOrgId = params?.orgId as string | undefined;
  const { activeOrg, isLoading: isOrgLoading } = useActiveOrganization();
  const resolvedOrgId = routeOrgId || activeOrg?.id;
  const { user } = useAuth();
  const orgName = useOrganizationName(resolvedOrgId, user?.organizations);

  const [apis, setApis] = useState<Dataservice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!resolvedOrgId) {
      setIsLoading(false);
      return;
    }
    async function loadDataservices() {
      setIsLoading(true);
      try {
        const response = await fetchOrgDataservices(resolvedOrgId!, 1, 9999);
        setApis(response.data || []);
      } catch (error) {
        console.error("Error loading org dataservices:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDataservices();
  }, [resolvedOrgId]);

  if (isOrgLoading) return <p>A carregar...</p>;
  if (!resolvedOrgId) {
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
            { label: "API", url: "#" },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">API</h1>
        <PublishDropdown />
      </div>

      <p className="text-neutral-700 text-sm mb-[16px]">
        {apis.length} resultados
      </p>

      <div className="flex items-end gap-[16px] mb-[24px]">
        <div className="admin-search-wrapper">
          <InputSearchBar hasVoiceActionButton={false}
            label="Pesquisar"
            placeholder="Pesquise o nome da API"
            aria-label="Pesquisar APIs"
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
      ) : apis.length > 0 ? (
        <Table
          paginationProps={{
            itemsPerPageLabel: "Linhas por página",
            itemsPerPage: 5,
            totalItems: apis.length,
            availablePageSizes: [5, 10, 20],
            currentPage: 0,
            buttonDropdownAriaLabel: "Selecionar linhas por página",
            dropdownListAriaLabel: "Opções de linhas por página",
            prevButtonAriaLabel: "Página anterior",
            nextButtonAriaLabel: "Próxima página",
          }}
        >
          <TableHeader>
            <TableRow>
              <TableHeaderCell sortType="date" sortOrder="none">
                Título da API
              </TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell sortType="date" sortOrder="none">
                Criado em
              </TableHeaderCell>
              <TableHeaderCell sortType="date" sortOrder="none">
                Modificado em
              </TableHeaderCell>
              <TableHeaderCell>Ações</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apis.map((api, index) => (
              <TableRow key={index}>
                <TableCell headerLabel="Título">
                  <a
                    href={`/pages/dataservices/${api.slug}`}
                    className="text-primary-600 underline"
                  >
                    {api.title}
                  </a>
                </TableCell>
                <TableCell headerLabel="Estado">
                  <StatusDot variant={api.private ? "warning" : "success"}>
                    {api.private ? "Rascunho" : "Público"}
                  </StatusDot>
                </TableCell>
                <TableCell headerLabel="Criado em">
                  {formatDate(api.created_at)}
                </TableCell>
                <TableCell headerLabel="Modificado em">
                  {formatDate(api.last_modified)}
                  <br />
                  <span className="text-sm text-neutral-500">
                    sobre{" "}
                    <span className="text-success-600">●</span>{" "}
                    {api.owner
                      ? `${api.owner.first_name} ${api.owner.last_name}`
                      : "—"}
                  </span>
                </TableCell>
                <TableCell headerLabel="Ações">
                  <div className="flex gap-[8px]">
                    <a href={`/pages/dataservices/${api.slug}`}>
                      <Icon name="agora-line-eye" className="w-[20px] h-[20px]" />
                    </a>
                    <a href={`/pages/admin/dataservices/edit?slug=${api.slug}`}>
                      <Icon name="agora-line-edit" className="w-[20px] h-[20px]" />
                    </a>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="datasets-page__body">
          <div className="datasets-page__content">
            <CardNoResults
              className="datasets-page__empty"
              position="center"
              icon={
                <Icon name="agora-line-edit" className="w-12 h-12 text-primary-500 icon-xl" />
              }
              title="Sem publicações"
              description="A organização ainda não publicou uma API."
              hasAnchor={false}
              extraDescription={
                <div className="mt-24">
                  <Button
                    variant="primary"
                    appearance="outline"
                    onClick={() => window.location.href = '/pages/admin/dataservices/new'}
                  >
                    Publique no portal
                  </Button>
                </div>
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
