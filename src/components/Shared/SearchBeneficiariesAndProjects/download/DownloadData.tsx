"use client";

import { useTranslation } from "react-i18next";
import { Typograph } from "../../Generics/Typograph";
import { Anchor } from "@ama-pt/agora-design-system";
import { useCallback } from "react";
import { usePathname } from "next/navigation";
import { twMerge } from "tailwind-merge";
import { useSearchBenProjStore } from "@/hooks/useSearchBenProj";
import { SourceInfo } from "@/service/types/datastories/datastory";

export interface IDownloadData {
  className?: string;
  sourceInfo?: SourceInfo[];
  showListing?: boolean;
}

export default function DownloadData({
  className,
  sourceInfo = [],
  showListing = true,
}: IDownloadData) {
  const { t, i18n } = useTranslation("common");
  const pathnameArray = usePathname()
    .split("/")
    .filter((segment) => segment !== i18n.language);

  const downloadList = useSearchBenProjStore((state) =>
    "downloadList" in state ? state.downloadList : undefined
  );
  const subject = useSearchBenProjStore((state) => state.subject);

  const handleDownloadListing = useCallback(
    (filename: string, source: string, update: string) => {
      downloadList?.(filename, pathnameArray, source, update, t);
    },
    [downloadList, pathnameArray, t]
  );

  if (!showListing || !downloadList) return null;

  return (
    <div className={twMerge("download-data flex flex-col gap-32", className)}>
      <div className="flex flex-row items-center gap-8">
        <Typograph tag="p" className="text-m-regular text-neutral-700">
          {t("download")}
        </Typograph>
        <Anchor
          appearance="text"
          variant="neutral"
          hasIcon
          trailingIcon="agora-line-download"
          trailingIconHover="agora-line-download"
          onClick={() =>
            handleDownloadListing(
              t("searchBenProj.exportResults", {
                subject: t(`searchBenProj.${subject}`),
              }),
              sourceInfo[0]?.source || "",
              sourceInfo[0]?.updateDate ||
                sourceInfo[0]?.modificationDate ||
                sourceInfo[0]?.referenceDate ||
                ""
            )
          }
        >
          {t("listing")}
        </Anchor>
      </div>
    </div>
  );
}
