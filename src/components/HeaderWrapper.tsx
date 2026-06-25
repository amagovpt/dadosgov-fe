'use client';

import dynamic from 'next/dynamic';
import type { HeaderNavigationData } from '@/service/types/header';

const Header = dynamic(
  () => import('@/components/Header').then((mod) => ({ default: mod.Header })),
  {
    ssr: false,
    loading: () => (
      <header className="sticky top-0 z-sticky bg-white" style={{ minHeight: '120px' }} aria-hidden="true" />
    ),
  }
);

export const HeaderWrapper = ({ data }: { data: HeaderNavigationData }) => <Header data={data} />;
