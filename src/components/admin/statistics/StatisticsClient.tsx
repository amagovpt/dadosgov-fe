"use client";

import {
  Breadcrumb,
  CardFrame,
  CardNoResults,
  Icon,
  InputSearchBar,
  Tabs,
  Tab,
  TabHeader,
  TabBody,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Button,
  InputSelect,
  DropdownSection,
  DropdownOption,
} from "@ama-pt/agora-design-system";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import PublishDropdown from "@/components/admin/PublishDropdown";

export default function StatisticsClient() {
  const { displayName } = useCurrentUser();
  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: displayName || "...", url: "#" },
            { label: "Estatísticas", url: "/pages/admin/me/statistics" },
          ]}
        />
      </div>

      <h1 className="admin-page__title mt-[64px] mb-16">Estatísticas</h1>

      <Tabs>
        <Tab active>
          <TabHeader>Utilizador</TabHeader>
          <TabBody>
            <div className="flex gap-24 mt-48">
              <div className="flex-1">
                <CardFrame label="0">
                  <p className="text-neutral-700 text-base">Conjuntos de dados</p>
                </CardFrame>
              </div>
              {/* Card API ocultado temporariamente
              <div className="flex-1">
                <CardFrame label="0">
                  <p className="text-neutral-700 text-base">API</p>
                </CardFrame>
              </div>
              */}
              <div className="flex-1">
                <CardFrame label="0">
                  <p className="text-neutral-700 text-base">Reutilizar</p>
                </CardFrame>
              </div>
            </div>
          </TabBody>
        </Tab>
        <Tab>
          <TabHeader>Conjuntos de dados</TabHeader>
          <TabBody>
            <div className="mt-[24px]">
              <div className="flex items-end gap-16 mb-[24px]">
                <div className="admin-search-wrapper">
                  <InputSearchBar hasVoiceActionButton={false}
                    label="Pesquisar"
                    placeholder="Pesquise o nome do conjunto de dados"
                    aria-label="Pesquisar conjuntos de dados"
                  />
                </div>
              </div>
              <Table
                paginationProps={{
                  itemsPerPageLabel: "Itens por página",
                  itemsPerPage: 10,
                  totalItems: 1,
                  availablePageSizes: [5, 10, 20],
                  currentPage: 0,
                  buttonDropdownAriaLabel: "Selecionar itens por página",
                  dropdownListAriaLabel: "Opções de itens por página",
                  prevButtonAriaLabel: "Página anterior",
                  nextButtonAriaLabel: "Próxima página",
                }}
              >
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>TÍTULO DO CONJUNTO DE DADOS</TableHeaderCell>
                    <TableHeaderCell sortType="date" sortOrder="none">
                      <Icon name="agora-line-chat" className="w-[16px] h-[16px]" />
                    </TableHeaderCell>
                    <TableHeaderCell sortType="date" sortOrder="none">
                      <Icon name="agora-line-eye" className="w-[16px] h-[16px]" />
                    </TableHeaderCell>
                    <TableHeaderCell sortType="date" sortOrder="none">
                      <Icon name="agora-line-download" className="w-[16px] h-[16px]" />
                    </TableHeaderCell>
                    <TableHeaderCell sortType="date" sortOrder="none">
                      <img src="/Icons/bar_chart.svg" alt="Reutilizações" className="w-[16px] h-[16px]" />
                    </TableHeaderCell>
                    <TableHeaderCell sortType="date" sortOrder="none">
                      <Icon name="agora-line-star" className="w-[16px] h-[16px]" />
                    </TableHeaderCell>
                    <TableHeaderCell>{""}</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell headerLabel="Título">
                      <a href="#" className="text-primary-600 underline">ddd</a>
                    </TableCell>
                    <TableCell headerLabel="Discussões">0</TableCell>
                    <TableCell headerLabel="Visualizações">0</TableCell>
                    <TableCell headerLabel="Downloads">0</TableCell>
                    <TableCell headerLabel="Tendências">0</TableCell>
                    <TableCell headerLabel="Favoritos">0</TableCell>
                    <TableCell headerLabel="Exportar">
                      <Icon name="agora-line-download" className="w-[16px] h-[16px]" />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabBody>
        </Tab>
        {/* Tab API ocultada temporariamente
        <Tab>
          <TabHeader>API</TabHeader>
          <TabBody>
            <div className="mt-[24px]">
              <p className="text-neutral-700 text-sm mb-16">
                0 resultados
              </p>

              <div className="flex items-end gap-16 mb-[24px]">
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
                  id="filter-api-status"
                >
                  <DropdownSection name="status">
                    <DropdownOption value="public">Público</DropdownOption>
                    <DropdownOption value="archived">Arquivo</DropdownOption>
                    <DropdownOption value="draft">Rascunho</DropdownOption>
                    <DropdownOption value="deleted">Excluído</DropdownOption>
                  </DropdownSection>
                </InputSelect>
              </div>

              <CardNoResults
                position="center"
                icon={
                  <img src="/Icons/reduce.svg" alt="" className="w-40 h-40" />
                }
                title="Sem publicações"
                description="Ainda não publicou uma API."
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
          </TabBody>
        </Tab>
        */}
        <Tab>
          <TabHeader>Reutilizar</TabHeader>
          <TabBody>
            <div className="mt-[24px]">
              <p className="text-neutral-700 text-sm mb-16">
                0 resultados
              </p>

              <div className="flex items-end gap-16 mb-[24px]">
                <div className="admin-search-wrapper">
                  <InputSearchBar hasVoiceActionButton={false}
                    label="Pesquisar"
                    placeholder="Pesquise o nome da reutilização"
                    aria-label="Pesquisar reutilizações"
                  />
                </div>
                <InputSelect
                  label=""
                  hideLabel
                  placeholder="Filtrar por estado"
                  id="filter-reuse-status"
                >
                  <DropdownSection name="status">
                    <DropdownOption value="" selected>Todos</DropdownOption>
                    <DropdownOption value="public">Público</DropdownOption>
                    <DropdownOption value="archived">Arquivado</DropdownOption>
                    <DropdownOption value="draft">Rascunho</DropdownOption>
                    <DropdownOption value="deleted">Excluído</DropdownOption>
                  </DropdownSection>
                </InputSelect>
              </div>

              <CardNoResults
                position="center"
                icon={
                  <img src="/Icons/bar_chart.svg" alt="" className="w-40 h-40" />
                }
                title="Sem publicações"
                description="Ainda não publicou uma reutilização."
                hasAnchor={false}
                extraDescription={
                  <div className="mt-24">
                    <Button
                      variant="primary"
                      appearance="outline"
                      onClick={() => window.location.href = '/pages/admin/reuses/new'}
                    >
                      Publique no portal
                    </Button>
                  </div>
                }
              />
            </div>
          </TabBody>
        </Tab>
      </Tabs>
    </div>
  );
}
