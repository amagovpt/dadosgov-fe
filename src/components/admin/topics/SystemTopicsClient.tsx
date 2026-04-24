"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Breadcrumb,
  CardNoResults,
  Icon,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import PublishDropdown from "@/components/admin/PublishDropdown";
import { fetchTopics } from "@/services/api";
import { Topic } from "@/types/api";

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

export default function SystemTopicsClient() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchTopics(currentPage, pageSize);
      setTopics(response.data || []);
      setTotalItems(response.total || 0);
    } catch (error) {
      console.error("Error loading topics:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: "Sistema", url: "#" },
            { label: "Temas", url: "/pages/admin/system/topics" },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">Temas</h1>
        <PublishDropdown />
      </div>

      <p className="text-neutral-700 text-sm mb-[16px]">
        {totalItems} resultados
      </p>

      {isLoading ? (
        <p className="text-neutral-700 text-sm">A carregar...</p>
      ) : topics.length > 0 ? (
        <Table
          paginationProps={{
            itemsPerPageLabel: "Linhas por página",
            itemsPerPage: pageSize,
            totalItems: totalItems,
            availablePageSizes: [5, 10, 20],
            currentPage: currentPage - 1,
            buttonDropdownAriaLabel: "Selecionar linhas por página",
            dropdownListAriaLabel: "Opções de linhas por página",
            prevButtonAriaLabel: "Página anterior",
            nextButtonAriaLabel: "Próxima página",
            onPageChange: (page: number) => setCurrentPage(page + 1),
            onPageSizeChange: (size: number) => {
              setPageSize(size);
              setCurrentPage(1);
            },
          }}
        >
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Nome</TableHeaderCell>
              <TableHeaderCell>Criado em</TableHeaderCell>
              <TableHeaderCell>Conjuntos de dados</TableHeaderCell>
              <TableHeaderCell>Reutilizações</TableHeaderCell>
              <TableHeaderCell>Ações</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topics.map((topic) => (
              <TableRow key={topic.id}>
                <TableCell headerLabel="Nome">
                  <a
                    href={`/pages/themes/${topic.slug}`}
                    className="text-primary-600 underline"
                  >
                    {topic.name}
                  </a>
                </TableCell>
                <TableCell headerLabel="Criado em">
                  {formatDate(topic.created_at)}
                </TableCell>
                <TableCell headerLabel="Conjuntos de dados">
                  {topic.datasets_count ?? 0}
                </TableCell>
                <TableCell headerLabel="Reutilizações">
                  {topic.reuses_count ?? 0}
                </TableCell>
                <TableCell headerLabel="Ações">
                  <div className="flex gap-[8px]">
                    <a href={`/pages/themes/${topic.slug}`}>
                      <Icon name="agora-line-eye" className="w-[20px] h-[20px]" />
                    </a>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <CardNoResults
          position="center"
          icon={
            <Icon
              name="agora-line-tag"
              className="w-12 h-12 text-primary-500 icon-xl"
            />
          }
          title="Sem temas"
          description="Nenhum tema encontrado."
          hasAnchor={false}
        />
      )}
    </div>
  );
}
