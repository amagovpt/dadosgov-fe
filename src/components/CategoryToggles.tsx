'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Toggle, Pill } from '@ama-pt/agora-design-system';
import { SiteMetrics } from '@/types/api';
import {
  searchDatasets,
  searchOrganizations,
  searchReuses,
  searchDataservices,
  fetchDatasets,
  fetchReuses,
  fetchOrganizations,
} from '@/services/api';

interface CategoryToggleItem {
  id: string;
  label: string;
  href: string;
  count: number;
  leadingIcon: string | ((active: boolean) => string);
  leadingIconHover: string;
  className?: string;
}

interface CategoryTogglesProps {
  siteMetrics: SiteMetrics;
  searchQuery?: string;
  exclude?: string[];
}

const buildItems = (siteMetrics: SiteMetrics): CategoryToggleItem[] => [
  {
    id: 'datasets',
    label: 'Conjunto de dados',
    href: '/pages/datasets',
    count: siteMetrics.datasets,
    leadingIcon: 'agora-line-layers-menu',
    leadingIconHover: 'agora-solid-layers-menu',
    className: 'w-full',
  },
  // APIs ocultas temporariamente
  // {
  //   id: 'apis',
  //   label: 'APIs',
  //   href: '/pages/dataservices',
  //   count: siteMetrics.dataservices ?? 0,
  //   leadingIcon: (active: boolean) =>
  //     active ? '/Icons/reduce_white.svg' : '/Icons/reduce.svg',
  //   leadingIconHover: '/Icons/reduce_white.svg',
  //   className: 'w-full agora-toggle agora-toggle-icon agora-toggle-icon-primary full-width has-icon',
  // },
  {
    id: 'reutilizacoes',
    label: 'Reutilizações',
    href: '/pages/reuses',
    count: siteMetrics.reuses,
    leadingIcon: (active: boolean) =>
      active ? '/Icons/bar_char_white.svg' : '/Icons/bar_chart_primary.svg',
    leadingIconHover: '/Icons/bar_char_white.svg',
    className: 'w-full agora-toggle agora-toggle-icon agora-toggle-icon-primary full-width has-icon',
  },
  {
    id: 'organizacoes',
    label: 'Organizações',
    href: '/pages/organizations',
    count: siteMetrics.organizations,
    leadingIcon: 'agora-line-buildings',
    leadingIconHover: 'agora-solid-buildings',
    className: 'w-full',
  },
];

const HREF_TO_ID: Record<string, string> = {
  '/pages/reuses': 'reutilizacoes',
  '/pages/datasets': 'datasets',
  '/pages/dataservices': 'apis',
  '/pages/organizations': 'organizacoes',
};

const ID_TO_SEARCH_KEY: Record<string, string> = {
  datasets: 'datasets',
  apis: 'dataservices',
  reutilizacoes: 'reuses',
  organizacoes: 'organizations',
};

interface SearchTotals {
  datasets: number;
  dataservices: number;
  reuses: number;
  organizations: number;
}

export const CategoryToggles = ({ siteMetrics, searchQuery, exclude = [] }: CategoryTogglesProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const items = buildItems(siteMetrics).filter((item) => !exclude.includes(item.id));
  const activeId = HREF_TO_ID[pathname] || '';

  const [realTotals, setRealTotals] = useState<SearchTotals | null>(null);
  const [searchTotals, setSearchTotals] = useState<SearchTotals | null>(null);
  const [isLoadingTotals, setIsLoadingTotals] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasQuery = !!(searchQuery && searchQuery.trim());

  // Fetch real totals from paginated endpoints on mount
  useEffect(() => {
    async function loadRealTotals() {
      try {
        const [dsRes, reuseRes, orgRes] = await Promise.all([
          fetchDatasets(1, 1),
          fetchReuses(1, 1),
          fetchOrganizations(1, 1),
        ]);
        setRealTotals({
          datasets: dsRes.total,
          dataservices: siteMetrics.dataservices ?? 0,
          reuses: reuseRes.total,
          organizations: orgRes.total,
        });
      } catch {
        // Keep siteMetrics as fallback
      }
    }
    loadRealTotals();
  }, [siteMetrics]);

  useEffect(() => {
    if (!hasQuery) {
      setSearchTotals(null);
      setIsLoadingTotals(false);
      return;
    }

    setIsLoadingTotals(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const q = searchQuery!.trim();
        const [dsRes, dsvcRes, reuseRes, orgRes] = await Promise.all([
          searchDatasets(q, 1, 1),
          searchDataservices(q, 1, 1),
          searchReuses(q, 1, 1),
          searchOrganizations(q, 1, 1),
        ]);
        setSearchTotals({
          datasets: dsRes.total,
          dataservices: dsvcRes.total,
          reuses: reuseRes.total,
          organizations: orgRes.total,
        });
      } catch (error) {
        console.error('Error fetching search totals:', error);
        setSearchTotals(null);
      } finally {
        setIsLoadingTotals(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, hasQuery]);

  const getCount = (item: CategoryToggleItem): number | null => {
    if (!hasQuery) {
      // Use real totals from paginated API if available, fallback to siteMetrics
      if (realTotals) {
        const key = ID_TO_SEARCH_KEY[item.id];
        if (key) return realTotals[key as keyof SearchTotals] ?? item.count ?? null;
      }
      return item.count ?? null;
    }
    if (!searchTotals) return null;
    const key = ID_TO_SEARCH_KEY[item.id];
    return key ? (searchTotals[key as keyof SearchTotals] ?? null) : (item.count ?? null);
  };

  const handleNavigation = (href: string) => {
    if (hasQuery) {
      const separator = href.includes('?') ? '&' : '?';
      router.push(`${href}${separator}q=${encodeURIComponent(searchQuery!.trim())}`);
    } else {
      router.push(href);
    }
  };

  return (
    <div className="mb-64 pr-32 max-w-[592px] flex flex-col gap-16">
      <h2 className="font-bold text-xl text-neutral-900 mb-16 mt-[12px]">Tipo</h2>
      {items.map((item) => {
        const isActive = item.id === activeId;
        const icon =
          typeof item.leadingIcon === 'function'
            ? item.leadingIcon(isActive)
            : item.leadingIcon;
        const count = getCount(item);

        return (
          <Toggle
            key={item.id}
            id={item.id}
            name="category-toggle"
            value={item.id}
            appearance="icon"
            variant="primary"
            hasIcon
            leadingIcon={icon}
            leadingIconHover={item.leadingIconHover}
            checked={isActive}
            onChange={() => handleNavigation(item.href)}
            iconOnly={false}
            fullWidth={true}
            className={item.className}
          >
            <div className="flex items-center gap-12 font-bold text-sm">
              <span
                className={
                  isActive
                    ? 'text-primary-600 font-bold'
                    : 'text-neutral-900 font-bold'
                }
              >
                {item.label}
              </span>
              <Pill
                variant="neutral"
                appearance="outline"
                circular={false}
                className="text-xs font-medium text-neutral-500 ml-16"
              >
                {isLoadingTotals && hasQuery
                  ? '...'
                  : count !== null
                    ? count.toLocaleString('pt-PT')
                    : '...'}
              </Pill>
            </div>
          </Toggle>
        );
      })}
    </div>
  );
};
