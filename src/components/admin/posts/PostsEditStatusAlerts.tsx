"use client";

import React from "react";
import { StatusCard } from "@ama-pt/agora-design-system";

interface PostsEditStatusAlertsProps {
  apiError: string | null;
  apiSuccess: string | null;
}

export default function PostsEditStatusAlerts({
  apiError,
  apiSuccess,
}: PostsEditStatusAlertsProps) {
  return (
    <>
      {apiError && <StatusCard variant="danger" showIcon description={apiError} />}
      {apiSuccess && <StatusCard variant="success" showIcon description={apiSuccess} />}
    </>
  );
}
