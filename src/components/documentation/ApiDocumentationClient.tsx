"use client";

import { StatusCard } from "@ama-pt/agora-design-system";
import Breadcrumb from "@/components/Primitives/Breadcrumb/Breadcrumb";

export default function ApiDocumentationClient() {
  return (
    <div className="container mx-auto px-16 py-32">
      <Breadcrumb
        items={[
          { label: "Início", url: "/" },
          { label: "Recursos", url: "/recursos" },
          { label: "Desenvolvimento", url: "/recursos/desenvolvimento" },
          { label: "Referência API", url: "/recursos/desenvolvimento/referencia-api" },
        ]}
      />

      <h1 className="mb-16 mt-24 text-2xl-bold">Referência API</h1>

      <StatusCard variant="warning" showIcon description="Página em manutenção" />
    </div>
  );
}
