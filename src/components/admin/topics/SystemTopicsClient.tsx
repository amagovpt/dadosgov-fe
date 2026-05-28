"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CardNoResults,
  Icon,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@ama-pt/agora-design-system";
import { fetchTopics } from "@/app/api/discussions-topics";
import type { Topic } from '@/service/types/topic';
import AdminLayout from "@/components/Layout/AdminLayout";
import { createPaginationProps } from "@/utils/createPaginationProps";
import TextLink from "@/components/Primitives/TextLink";
import ResultsCount from "../ResultsCount";
import TableActionsCell from "../TableActionsCell";

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
    <AdminLayout
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: "Sistema", url: "#" },
        { label: "Temas", url: "/pages/admin/system/topics" },
      ]}
      title="Temas"
    >

      <ResultsCount count={totalItems} isLoading={isLoading} />

      {isLoading ? (
        <p className="text-sm text-neutral-700">A carregar...</p>
      ) : topics.length > 0 ? (
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
                  <TextLink href={`/pages/themes/${topic.slug}`}>{topic.name}</TextLink>
                </TableCell>
                <TableCell headerLabel="Criado em">{formatDate(topic.created_at)}</TableCell>
                <TableCell headerLabel="Conjuntos de dados">{topic.datasets_count ?? 0}</TableCell>
                <TableCell headerLabel="Reutilizações">{topic.reuses_count ?? 0}</TableCell>
                <TableCell headerLabel="Ações">
                  <TableActionsCell
                    viewAction={{
                      href: `/pages/themes/${topic.slug}`,
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
          icon={<Icon name="agora-line-tag" className="icon-xl h-12 w-12 text-primary-500" />}
          title="Sem temas"
          description="Nenhum tema encontrado."
          hasAnchor={false}
        />
      )}
    </AdminLayout>
  );
}
