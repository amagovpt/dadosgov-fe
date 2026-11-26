"use client";

import { Suspense } from "react";
import { Header } from "@/components/Header";
import type { HeaderNavigationData } from "@/service/types/header";

export const HeaderWrapper = ({ data }: { data: HeaderNavigationData }) => (
  <Suspense
    fallback={
      <header
        className="sticky top-0 z-sticky bg-white"
        style={{ minHeight: "120px" }}
        aria-hidden="true"
      />
    }
  >
    <Header data={data} />
  </Suspense>
);
