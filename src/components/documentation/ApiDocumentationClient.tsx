"use client";

import { StatusCard } from "@ama-pt/agora-design-system";
import BreadcrumbDynamic from "@/components/Shared/BreadcrumbDynamic";

export default function ApiDocumentationClient() {
  return (
    <div className="container mx-auto px-16 py-32">
      <BreadcrumbDynamic darkMode={false} />

      <h1 className="mb-16 mt-24 text-2xl-bold">Referência API</h1>

      <StatusCard variant="warning" showIcon description="Página em manutenção" />
    </div>
  );
}
