"use client";

import React from "react";
import { StatusCard } from "@ama-pt/agora-design-system";

interface FormStatusMessagesProps {
  successMessage?: React.ReactNode;
  errorMessage?: React.ReactNode;
  successClassName?: string;
  errorClassName?: string;
}

export default function FormStatusMessages({
  successMessage,
  errorMessage,
  successClassName = "mb-16",
  errorClassName = "mb-16",
}: FormStatusMessagesProps) {
  return (
    <>
      {successMessage && (
        <div className={successClassName}>
          <StatusCard variant="success" showIcon description={successMessage} />
        </div>
      )}

      {errorMessage && (
        <div className={errorClassName}>
          <StatusCard variant="danger" showIcon description={errorMessage} />
        </div>
      )}
    </>
  );
}
