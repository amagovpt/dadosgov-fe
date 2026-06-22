"use client";

import { Breadcrumb, StatusCard } from "@ama-pt/agora-design-system";

export default function DocApiClient() {
  return (
    <div className="container mx-auto px-16 py-32">
      <Breadcrumb
        items={[
          { label: "Início", url: "/" },
          { label: "API do portal", url: "/docapi" },
        ]}
      />

      <h1 className="text-2xl-bold mt-24 mb-16">API do portal</h1>

      <StatusCard
        variant="warning"
        showIcon
        description="Página em manutenção"
      />
    </div>
  );
}
