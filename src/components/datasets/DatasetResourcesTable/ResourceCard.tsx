"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@ama-pt/agora-design-system";
import { Resource } from "@/service/types/dataset";
import { formatDateLong } from "@/utils/formatDate";
import { ResourceExpandedContent } from "./ResourceExpandedContent";
import { downloadUrl, formatBytes } from "./utils";

const DESCRIPTION_COLLAPSE_LIMIT = 280;

export const ResourceCard: React.FC<{
  resource: Resource;
  isExpanded: boolean;
  onToggle: () => void;
  authorName?: string;
  authorUrl?: string;
  isOrganization?: boolean;
}> = ({ resource, isExpanded, onToggle, authorName, authorUrl, isOrganization }) => {
  const { i18n } = useTranslation("common");
  const { t: tds } = useTranslation("datasets");
  const locale = i18n.language as "pt" | "en";
  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);
  const hasLongDescription = (resource.description?.length ?? 0) > DESCRIPTION_COLLAPSE_LIMIT;

  return (
    <div className="flex flex-col gap-24 bg-white p-32">
      <div className="flex flex-col gap-16">
        <p className="max-w-[592px] text-s-regular">
          {tds("resources.updatedOn", {
            date: formatDateLong(resource.last_modified ?? resource.created_at, locale),
          })}
        </p>
        <div className="flex flex-col gap-8">
          <h4 className="inline-flex max-w-[592px] items-center gap-8 text-xl-bold text-neutral-900">
            {resource.title}
            {/*<button
            type="button"
            onClick={() => navigator.clipboard.writeText(resource.title)}
            className="shrink-0 cursor-pointer text-primary-600 hover:text-primary-800"
            aria-label={tds("resources.copyTitle")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: "20px", height: "20px", minWidth: "20px" }}
              aria-hidden="true"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>*/}
          </h4>
          {resource.description && (
            <>
              <p
                className={`text-base break-words whitespace-pre-wrap text-neutral-900 max-w-[592px]${
                  hasLongDescription && !isDescriptionExpanded ? "line-clamp-3" : ""
                }`}
              >
                {resource.description}
              </p>
              {hasLongDescription && (
                <button
                  type="button"
                  onClick={() => setIsDescriptionExpanded((expanded) => !expanded)}
                  className="inline-flex max-w-[592px] cursor-pointer self-start text-primary-600 hover:underline"
                  aria-expanded={isDescriptionExpanded}
                >
                  {isDescriptionExpanded ? tds("resources.seeLess") : tds("resources.seeMore")}
                </button>
              )}
            </>
          )}
          {authorName && (
            <p className="text-sm max-w-[592px] text-neutral-900">
              {tds("resources.by")}{" "}
              {authorUrl ? (
                <a href={authorUrl} className="text-primary-600 hover:underline">
                  {authorName}
                </a>
              ) : (
                <span>{authorName}</span>
              )}
            </p>
          )}
          <p className="text-m-bold text-neutral-700">
            {tds("resources.format", {
              format: resource.format || tds("resources.fileFallback"),
            })}{" "}
            {resource.filesize ? `(${formatBytes(resource.filesize, locale)})` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex max-w-[592px] cursor-pointer items-center gap-8 py-8 text-primary-600 hover:underline"
        >
          <Icon
            name={isExpanded ? "agora-line-chevron-up" : "agora-line-chevron-down"}
            className="h-6 w-6"
          />
          <span>{isExpanded ? tds("resources.seeLess") : tds("resources.seeMore")}</span>
        </button>
      </div>
      {isExpanded && (
        <div className="px-32 pb-32">
          <ResourceExpandedContent resource={resource} />
        </div>
      )}
      <div className="h-px w-full bg-neutral-200" />
    </div>
  );
};
