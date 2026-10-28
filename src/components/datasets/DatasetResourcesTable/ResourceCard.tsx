"use client";

import { FC } from "react";
import { useTranslation } from "react-i18next";
import { Resource } from "@/service/types/dataset";
import { formatDateLong } from "@/utils/formatDate";
import { downloadUrl, formatBytes } from "./utils";
import Button from "@/components/Primitives/Button";
import { ModalConfiguration, useModalContext } from "@ama-pt/agora-design-system";
import { ResourceExpandedContent } from "./ResourceExpandedContent";
import { Typograph } from "@/components/Shared/Generics/Typograph";
import { twMerge } from "tailwind-merge";

const DESCRIPTION_COLLAPSE_LIMIT = 280;

export const ResourceCard: FC<{
  resource: Resource;
  authorName?: string;
  authorUrl?: string;
  isOrganization?: boolean;
  className?: string;
}> = ({ resource, className }) => {
  const { t, i18n } = useTranslation("common");
  const { t: tds } = useTranslation("datasets");
  const { show, hide } = useModalContext();

  const locale = i18n.language as "pt" | "en";
  const hasLongDescription = (resource.description?.length ?? 0) > DESCRIPTION_COLLAPSE_LIMIT;

  const openModal = () => {
    show(
      <div className="flex flex-col gap-64">
        <Typograph tag="h2" className="text-2xl-bold text-neutral-900">
          {tds("resources.details")}
        </Typograph>
        <ResourceExpandedContent resource={resource} />
        <div className="w-fit self-end">
          <Button
            appearance="outline"
            hasIcon
            leadingIcon="agora-line-arrow-left-circle"
            leadingIconHover="agora-line-arrow-left-circle"
            onClick={() => hide()}
          >
            {tds("goToDataset")}
          </Button>
        </div>
      </div>,
      {
        title: tds("resources.details"),
        closeButtonLabel: t("close"),
        darkMode: false,
      } as ModalConfiguration
    );
  };

  return (
    <div className={twMerge("flex flex-col gap-24 bg-white p-32", className)}>
      <div className="flex flex-col gap-16">
        <p className="max-w-[592px] text-s-regular">
          {tds("resources.updatedOn", {
            date: formatDateLong(resource.last_modified ?? resource.created_at, locale),
          })}
        </p>

        <div className="flex flex-col gap-8">
          <h4 className="inline-flex max-w-[592px] items-center gap-8 text-xl-bold text-neutral-900">
            {resource.title}
          </h4>

          <p className="text-m-bold text-neutral-700">
            {tds("resources.format", {
              format: resource.format || tds("resources.fileFallback"),
            })}{" "}
            {resource.filesize ? `(${formatBytes(resource.filesize, locale)})` : ""}
          </p>

          {resource.description && (
            <p
              className={`max-w-[592px] text-base wrap-break-word whitespace-pre-wrap text-neutral-900 ${
                hasLongDescription ? "line-clamp-3" : ""
              }`}
            >
              {resource.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-32">
          <Button
            appearance="link"
            hasIcon
            trailingIcon="agora-line-eye"
            trailingIconHover="agora-line-eye"
            className="p-0"
            onClick={openModal}
          >
            {tds("resources.details")}
          </Button>

          {/*
            A plain anchor, deliberately not `next/link`: the href is the backend's
            download permalink, not a route. The router prefetches a `<Link>` on sight,
            which made the backend fetch the file from its origin with nobody asking —
            answering 502 when that origin is slow, or the OGC 302 the browser then
            blocks on `connect-src`. Either way the global API error policy raised a
            toast on a page where nothing was wrong (LEDG-2675).

            No `download` attribute: the backend already sends Content-Disposition
            with the filename `_ensure_extension` built (LEDG-1765), and a client-side
            `download` would override it.
          */}
          <a
            href={downloadUrl(resource)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-600!"
          >
            <Button
              appearance="link"
              hasIcon
              trailingIcon="agora-line-download"
              trailingIconHover="agora-line-download"
              className="p-0"
            >
              {tds("resources.download")}
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};
