"use client";

import { Breadcrumb, StatusCard } from "@ama-pt/agora-design-system";

export default function ApiDocumentationClient() {
  return (
    <div className="container mx-auto px-16 py-32">
      <Breadcrumb
        items={[
          { label: "Home", url: "/" },
          { label: "Referência API", url: "/faqs/api-documentation" },
        ]}
      />

      <h1 className="text-2xl-bold mt-24 mb-16">Referência API</h1>

      <StatusCard
        variant="warning"
        showIcon
        description="Página em manutenção"
      />
    </div>
  );
}
