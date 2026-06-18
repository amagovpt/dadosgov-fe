import React from "react";
import { StatusCard } from "@ama-pt/agora-design-system";

export default function ReusesEditDatasetsNotices() {
  return (
    <>
      <div className="mb-24">
        <StatusCard
          variant="warning"
          showIcon
          description="Pode associar conjuntos de dados deste portal ou indicar links para conjuntos de dados externos, mas não as duas opções na mesma reutilização."
        />
      </div>
    </>
  );
}
