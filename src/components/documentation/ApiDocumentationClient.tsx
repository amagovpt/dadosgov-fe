"use client";

import { Breadcrumb, StatusCard } from "@ama-pt/agora-design-system";

export default function ApiDocumentationClient() {
  return (
    <div className="container mx-auto px-16 py-32">
      <Breadcrumb
        items={[
          { label: "Início", url: "/" },
          { label: "Referência da API", url: "/pages/faqs/api-documentation" },
        ]}
      />

      <h1 className="text-2xl-bold mt-24 mb-16">Referência da API</h1>

      <StatusCard
        variant="warning"
        showIcon
        description="Página em manutenção"
      />
    </div>
  );
}
