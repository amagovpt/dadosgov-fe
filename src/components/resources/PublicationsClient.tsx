"use client";

import { useCallback, useOptimistic, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CardLinks from "@/components/Primitives/Cards/CardLinks";
import CardNoResults from "@/components/Primitives/Cards/CardNoResults";
import Icon from "@/components/Primitives/Icon";
import Anchor from "@/components/Shared/Anchor";
import { Pagination } from "@/components/Pagination";
import { Publication } from "@/service/types/resources/publications";
import {
  PUBLICATIONS_PAGE_SIZE,
  PublicationsSort,
} from "@/utils/publicationsListing";
import { formatDateLong } from "@/utils/formatDate";
import { getAssets } from "@/utils/getAssets";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { Toggle, ToggleGroup } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";

type PublicationWithPageCount = Publication & { pageCount: number | null };

interface PublicationsClientProps {
  publications: PublicationWithPageCount[];
  total: number;
  currentPage: number;
  currentSort: PublicationsSort;
}

export default function PublicationsClient({
  publications,
  total,
  currentPage,
  currentSort,
}: PublicationsClientProps) {
  const { t, i18n } = useTranslation("common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [optimisticSort, setOptimisticSort] = useOptimistic(currentSort);

  const handleSortChange = useCallback(
    (sort: string) => {
      startTransition(() => {
        setOptimisticSort(sort as PublicationsSort);
        const params = new URLSearchParams(searchParams.toString());
        if (sort === "recente") {
          params.delete("sort");
        } else {
          params.set("sort", sort);
        }
        params.delete("page");
        const qs = params.toString();
        router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    },
    [pathname, router, searchParams, setOptimisticSort]
  );

  return (
    <div className="container flex flex-col items-center justify-center gap-32 py-32">
      <div className="w-full flex justify-between items-end border-b-2 border-neutral-200 mb-24 pb-12 pt-32">
        <span className="text-neutral-900 text-m-regular">
          {t("publications.results", { count: total })}
        </span>
        <ToggleGroup
          multiple={false}
          value={[optimisticSort]}
          onChange={(val) => {
            const selected = val.length > 0 ? val[0] : "recente";
            if (selected !== optimisticSort) {
              handleSortChange(selected);
            }
          }}
        >
          {(["recente", "antigo"] as PublicationsSort[]).map((key) => (
            <Toggle
              key={key}
              value={key}
              aria-label={t("publications.sortBy", { label: t(`publications.sort.${key}`) })}
            >
              {t(`publications.sort.${key}`)}
            </Toggle>
          ))}
        </ToggleGroup>
      </div>
      {publications.length > 0 ? (
        publications.map((pubs) => {
          return (
            <div key={pubs.metaDetails.id} className="h-full w-full">
              <CardLinks
                className="!h-full [&_.image-content]:!h-full [&_.image-content]:!max-h-[312px] [&_.image-content]:!w-full [&_.image-content]:!max-w-[464px] [&_img]:!object-cover [&_img]:!h-full [&_img]:!w-full [&_img]:!max-h-[312px] [&_img]:!max-w-[464px] [&_.card-links-container]:!h-full [&_.text-content]:!w-full [&_.content]:!flex-col [&_.content]:lg:!flex-row [&_.content]:lg:!gap-32 cursor-pointer text-neutral-900"
                variant="transparent"
                image={{
                  src:
                    pubs.cover && pubs.cover[0]
                      ? getAssets(pubs.cover[0].id)
                      : "/card-full-image.png",
                  alt: pubs.metaDetails.title,
                }}
                title={<div className="text-xl-bold underline">{pubs.metaDetails.title}</div>}
                description={
                  <div className="flex flex-col justify-between h-full w-full gap-88">
                    <div>
                      <p className="text-sm mt-8 line-clamp-3 max-w-[592px] leading-relaxed text-neutral-900">
                        {formatHtmlParagraphs(pubs.metaDetails.description)}
                      </p>
                    </div>
                    {pubs.document && pubs.document[0] && (
                      <div className="flex gap-32 items-center">
                        <Anchor
                          target="_blank"
                          hasIcon
                          href={getAssets(pubs.document[0].slug)}
                          leadingIcon="agora-line-download"
                          leadingIconActive="agora-line-download"
                          leadingIconHover="agora-solid-download"
                        >
                          {t("publications.downloadFile")}
                        </Anchor>
                        <div className="text-neutral-900 text-m-light flex gap-4">
                          <span className="text-neutral-900 text-m-light uppercase">
                            {pubs.document && pubs.document[0].fileType}
                          </span>
                          ·
                          <span className="text-neutral-900 text-m-light">
                            {pubs.document && pubs.document[0].metadataText}
                          </span>
                          {pubs.pageCount !== null && (
                            <>
                              ·
                              <span className="text-neutral-900 text-m-light">
                                {t("publications.pages", { count: pubs.pageCount })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                }
                date={
                  <span className="font-[300]">
                    {t("publications.updated", {
                      date: formatDateLong(pubs.metaDetails.updatedAt, i18n.language as "pt" | "en"),
                    })}
                  </span>
                }
              />
            </div>
          );
        })
      ) : (
        <div className="col-span-full">
          <CardNoResults
            icon={<Icon name="agora-line-search" className="h-12 w-12 text-primary-500" />}
            title={t("publications.empty")}
            position="center"
            hasAnchor={true}
          />
        </div>
      )}

      <div className="mt-8 flex w-full justify-center">
        <Pagination currentPage={currentPage} totalItems={total} pageSize={PUBLICATIONS_PAGE_SIZE} />
      </div>
    </div>
  );
}
