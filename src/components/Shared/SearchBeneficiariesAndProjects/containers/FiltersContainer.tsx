"use client";

import useMobile from "@/hooks/useMobile";
import { ReactNode } from "react";

export interface ISearchBenProjFiltersContainer {
  children: ReactNode;
  download?: ReactNode;
}

export default function SearchBenProjFiltersContainer({
  children,
  download,
}: ISearchBenProjFiltersContainer) {
  const isMobile = useMobile();

  if (isMobile) {
    return null;
  }

  return (
    <div className="col-span-12 xl:col-span-4 hidden xl:flex flex-col pb-128 gap-64">
      <div className="row-span-1 bg-neutral-50 xl:-ml-112 xl:pl-112 py-64 pr-64 flex flex-col gap-32">
        {children}
      </div>
      {download && <div className="pr-64">{download}</div>}
    </div>
  );
}
