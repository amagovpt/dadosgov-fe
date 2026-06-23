"use client";

import { useState } from "react";
import DatasetsAdminClient from "@/components/admin/datasetsadmin/DatasetsAdminClient";

export default function DatasetsAdminPage() {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <DatasetsAdminClient
      currentStep={currentStep}
      onNextStep={() => setCurrentStep((s) => s + 1)}
      onPreviousStep={() => setCurrentStep((s) => Math.max(0, s - 1))}
    />
  );
}
