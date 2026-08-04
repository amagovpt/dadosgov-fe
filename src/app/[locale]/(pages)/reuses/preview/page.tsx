"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button, Pill } from "@ama-pt/agora-design-system";
import Breadcrumb from "@/components/Primitives/Breadcrumb/Breadcrumb";

function ReusePreviewContent() {
  const { t } = useTranslation("common");
  const { t: tR } = useTranslation("reuses");
  const searchParams = useSearchParams();
  const [isFavorite, setIsFavorite] = useState(false);

  const title = searchParams.get("title") || tR("detail.untitled");
  const description = searchParams.get("description") || tR("detail.noDescription");

  return (
    <div className="flex flex-col justify-center items-center">
      <main className="container flex flex-col gap-24">
        <div className="flex justify-between items-center ">
          <Breadcrumb
            items={[
              { label: t("breadcrumbs.home"), url: "/" },
              { label: t("breadcrumbs.reuses"), url: "/admin/me/reuses" },
              { label: title, url: "#" },
            ]}
          />
        </div>

        <div className="flex justify-end items-center gap-16 ">
          <Pill variant="warning">{tR("detail.draft")}</Pill>
          <Button
            variant="primary"
            appearance={isFavorite ? "solid" : "outline"}
            hasIcon={true}
            leadingIcon={isFavorite ? "agora-solid-star" : "agora-line-star"}
            leadingIconHover="agora-solid-star"
            className="flex-shrink-0"
            onClick={() => setIsFavorite(!isFavorite)}
          >
            {isFavorite ? tR("detail.removeFavorite") : tR("detail.addFavorite")}
          </Button>
        </div>

        <div className="">
          <h1 className="text-xl-bold text-primary-900 leading-tight ">
            {title}
          </h1>
          <p className="text-neutral-900 text-m-light">{description}</p>
        </div>
      </main>
    </div>
  );
}

export default function ReusePreviewPage() {
  return (
    <Suspense>
      <ReusePreviewContent />
    </Suspense>
  );
}
