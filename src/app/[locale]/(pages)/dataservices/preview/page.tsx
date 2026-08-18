"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button, Pill } from "@ama-pt/agora-design-system";
import Breadcrumb from "@/components/Primitives/Breadcrumb/Breadcrumb";

function DataservicePreviewContent() {
  const { t } = useTranslation("common");
  const { t: tDs } = useTranslation("dataservices");
  const searchParams = useSearchParams();
  const [isFavorite, setIsFavorite] = useState(false);

  const title = searchParams.get("title") || tDs("detail.untitled");
  const description = searchParams.get("description") || tDs("detail.noDescription");

  return (
    <div className="flex flex-col justify-center items-center">
      <main className="container flex flex-col gap-24">
        <div className="flex justify-between items-center">
          {/*
            Kept static on purpose: this preview is reached from the backoffice,
            so the trail walks back to /admin/dataservices rather than mirroring
            the public /dataservices/preview URL.
          */}
          <Breadcrumb
            items={[
              { label: t("breadcrumbs.home"), url: "/" },
              { label: t("breadcrumbs.dataservices"), url: "/admin/dataservices" },
              { label: title, url: "#" },
            ]}
          />
        </div>

        <div className="flex justify-end items-center gap-16">
          <Pill variant="warning">{tDs("detail.draft")}</Pill>
          <Button
            variant="primary"
            appearance={isFavorite ? "solid" : "outline"}
            hasIcon={true}
            leadingIcon={isFavorite ? "agora-solid-star" : "agora-line-star"}
            leadingIconHover="agora-solid-star"
            className="flex-shrink-0"
            onClick={() => setIsFavorite(!isFavorite)}
          >
            {isFavorite ? tDs("detail.removeFavorite") : tDs("detail.addFavorite")}
          </Button>
        </div>

        <div className="">
          <h1 className="text-xl-bold text-primary-900 leading-tight">
            {title}
          </h1>
          <p className="text-neutral-900 text-m-light">{description}</p>
        </div>
      </main>
    </div>
  );
}

export default function DataservicePreviewPage() {
  return (
    <Suspense>
      <DataservicePreviewContent />
    </Suspense>
  );
}
