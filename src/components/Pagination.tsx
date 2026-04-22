'use client';

import React, { useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SearchPagination } from '@ama-pt/agora-design-system';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  baseUrl?: string;
}

export const Pagination = ({
  currentPage,
  totalItems,
  pageSize,
  baseUrl = '/pages/datasets',
}: PaginationProps) => {
  const router = useRouter();
  const totalPages = Math.ceil(totalItems / pageSize);
  const initialIgnored = useRef(true);

  const handlePageChange = useCallback(
    (page: number) => {
      const targetPage = page + 1; // SearchPagination usa 0-based
      // Ignora o primeiro onChange que o SearchPagination dispara no mount
      if (initialIgnored.current) {
        initialIgnored.current = false;
        return;
      }
      if (targetPage === currentPage) return;

      const [path, baseQuery] = baseUrl.split('?');
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      if (baseQuery) {
        const baseParams = new URLSearchParams(baseQuery);
        baseParams.forEach((value, key) => params.set(key, value));
      }
      params.set('page', String(targetPage));
      const qs = params.toString();
      const finalUrl = `${path}${qs ? `?${qs}` : ''}`;
      router.push(finalUrl);
    },
    [currentPage, router, baseUrl]
  );

  if (totalPages <= 1) return null;

  return (
    <SearchPagination
      totalPages={totalPages}
      onChange={handlePageChange}
      label="Paginação"
      nextPageAriaLabel="Próxima página"
      previousPageAriaLabel="Página anterior"
      boundaryCount={1}
      siblingCount={1}
    />
  );
};
