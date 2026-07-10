"use client";

import { useRouter } from "next/navigation";
import { Button, Icon } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";

interface ListingErrorBannerProps {
  entity?: string;
  errorStatus?: number | "network";
}

function formatErrorStatus(status: number | "network"): string {
  if (status === "network") return "Erro de rede";
  return `HTTP ${status}`;
}

export default function ListingErrorBanner({
  entity = "os resultados",
  errorStatus,
}: ListingErrorBannerProps) {
  const { t } = useTranslation("common");

  const router = useRouter();

  return (
    <div className="col-span-full">
      <div className="rounded-lg border-red-200 bg-red-50 mx-auto flex max-w-[592px] flex-col items-center gap-16 border p-32 text-center">
        <Icon name="agora-line-alert-triangle" className="text-red-600 h-12 w-12" />
        <h3 className="text-xl-bold text-neutral-900">
          {t("listingError.title")} {entity}
        </h3>
        <p className="text-m-regular text-neutral-700">{t("listingError.subtitle")}</p>
        {errorStatus !== undefined && (
          <p className="text-s-regular text-neutral-600">{formatErrorStatus(errorStatus)}</p>
        )}
        <Button variant="primary" appearance="outline" onClick={() => router.refresh()}>
          {t("retry")}
        </Button>
      </div>
    </div>
  );
}
