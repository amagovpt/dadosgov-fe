'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@ama-pt/agora-design-system';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  baseUrl?: string; // kept for API compatibility, not used
}

function buildPageUrl(page: number): string {
  if (typeof window === 'undefined') return `?page=${page}`;
  const params = new URLSearchParams(window.location.search);
  if (page === 1) {
    params.delete('page');
  } else {
    params.set('page', String(page));
  }
  const qs = params.toString();
  return `${window.location.pathname}${qs ? `?${qs}` : ''}`;
}

function getPageRange(current: number, total: number): (number | '...')[] {
  const boundary = 1;
  const sibling = 1;
  const pages = new Set<number>();

  for (let i = 1; i <= Math.min(boundary, total); i++) pages.add(i);
  for (let i = Math.max(total - boundary + 1, 1); i <= total; i++) pages.add(i);
  for (let i = Math.max(1, current - sibling); i <= Math.min(total, current + sibling); i++) {
    pages.add(i);
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const range: (number | '...')[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) range.push('...');
    range.push(p);
    prev = p;
  }
  return range;
}

export const Pagination = ({ currentPage, totalItems, pageSize }: PaginationProps) => {
  const router = useRouter();
  const totalPages = Math.ceil(totalItems / pageSize);

  const navigate = useCallback(
    (page: number) => {
      router.push(buildPageUrl(page));
    },
    [router]
  );

  if (totalPages <= 1) return null;

  const pageRange = getPageRange(currentPage, totalPages);

  return (
    <nav aria-label="Paginação" className="agora-search-pagination">
      <Button
        appearance="link"
        hasIcon="true"
        iconOnly="true"
        leadingIcon="agora-solid-chevron-left"
        leadingIconHover="agora-solid-chevron-left"
        disabled={currentPage <= 1}
        className="nav-arrows show-arrow"
        aria-label="Página anterior"
        onClick={() => navigate(currentPage - 1)}
      />
      <div className="nav-pages">
        {pageRange.map((p, i) =>
          p === '...' ? (
            <div key={`dots-${i}`} className="nav-number-overlay">
              ...
            </div>
          ) : (
            <div key={p} onClick={() => navigate(p)}>
              <Button
                className={`search-page${p === currentPage ? ' current' : ''}`}
                appearance="link"
                aria-label={String(p)}
                {...(p === currentPage ? { 'aria-current': 'page' } : {})}
              >
                {p}
              </Button>
            </div>
          )
        )}
      </div>
      <Button
        appearance="link"
        hasIcon="true"
        iconOnly="true"
        trailingIcon="agora-solid-chevron-right"
        trailingIconHover="agora-solid-chevron-right"
        disabled={currentPage >= totalPages}
        className="nav-arrows show-arrow"
        aria-label="Próxima página"
        onClick={() => navigate(currentPage + 1)}
      />
    </nav>
  );
};
