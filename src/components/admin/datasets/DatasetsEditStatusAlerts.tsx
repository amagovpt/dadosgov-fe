"use client";

import React from "react";
import { StatusCard } from "@ama-pt/agora-design-system";

type DatasetsEditStatusAlertsProps = {
  apiError: string | null;
  apiSuccess: string | null;
};

export default function DatasetsEditStatusAlerts({
  apiError,
  apiSuccess,
}: DatasetsEditStatusAlertsProps) {
  return (
    <>
      {apiError && (
        <div className="my-24">
          <StatusCard variant="danger" showIcon description={apiError} />
        </div>
      )}
      {apiSuccess && (
        <div className="my-24">
          <StatusCard variant="success" showIcon description={apiSuccess} />
        </div>
      )}
    </>
  );
}
