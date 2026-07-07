"use client";

import { StatusCard } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";

export default function HarvestersAcceptedStatusInfoCard() {
  const { t } = useTranslation("admin-harvesters");

  return (
    <div className="mb-24">
      <StatusCard
        variant="informative"
        showIcon
        description={t("filters.acceptedInfo")}
      />
    </div>
  );
}
