"use client";

import { SearchPagination } from "@ama-pt/agora-design-system";

interface TabPaginationProps {
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export function TabPagination({ total, pageSize, onChange }: TabPaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="mt-32 flex justify-center">
      <SearchPagination
        totalPages={totalPages}
        onChange={(page: number) => onChange(page + 1)}
        label="Paginação"
        nextPageAriaLabel="Próxima página"
        previousPageAriaLabel="Página anterior"
        boundaryCount={1}
        siblingCount={1}
      />
    </div>
  );
}
