"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { CommunityResource } from "@/service/types/community-resource";
import { Resource } from "@/service/types/dataset";
import { ResourceCard } from "./ResourceCard";
import { DatasetResourcesTableProps } from "./types";
import { Pagination } from "@/components/Pagination";

const ITEMS_PER_PAGE = 6;

export const DatasetResourcesTable: React.FC<DatasetResourcesTableProps> = ({
  resources,
  communityResources,
}) => {
  const { t: tds } = useTranslation("datasets");
  const [filePage, setFilePage] = useState<number>(1);
  const [docPage, setDocPage] = useState<number>(1);
  const [comPage, setComPage] = useState<number>(1);

  const documentationFiles = resources.filter((r) => r.type === "documentation");
  const principalFiles = resources.filter((r) => r.type !== "documentation");

  const nFiles = principalFiles.length;
  const nDocs = documentationFiles.length;
  const nCom = communityResources?.length ?? 0;

  const files = principalFiles.slice(ITEMS_PER_PAGE * (filePage - 1), ITEMS_PER_PAGE * filePage);
  const docs = documentationFiles.slice(ITEMS_PER_PAGE * (docPage - 1), ITEMS_PER_PAGE * docPage);
  const coms =
    communityResources?.slice(ITEMS_PER_PAGE * (comPage - 1), ITEMS_PER_PAGE * comPage) ?? [];

  const getAuthorInfo = (cr: CommunityResource) => {
    if (cr.organization) {
      return {
        name: cr.organization.name,
        url: `/organizations/${cr.organization.slug || cr.organization.id}`,
        isOrg: true,
      };
    }
    if (cr.owner) {
      const fullName = `${cr.owner.first_name} ${cr.owner.last_name}`.trim();
      return {
        name: fullName || cr.owner.slug,
        url: `/users/${cr.owner.slug || cr.owner.id}`,
        isOrg: false,
      };
    }
    return null;
  };

  return (
    <div className="space-y-32">
      {nFiles > 0 && (
        <div className="flex flex-col gap-32">
          <h3 className="text-xl-bold text-neutral-900">
            {tds("resources.mainFiles", { count: nFiles })}
          </h3>
          <div className="grid grid-cols-12 gap-32">
            {files.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={{ ...resource, type: "main" }}
                className="col-span-12 lg:col-span-6"
              />
            ))}
          </div>
          <div className="mt-32 w-full max-w-[696px] self-center">
            <Pagination
              currentPage={filePage}
              onPageChange={(page) => setFilePage(page)}
              pageSize={ITEMS_PER_PAGE}
              totalItems={nFiles}
              isOnUrl={false}
            />
          </div>
        </div>
      )}

      {nDocs > 0 && (
        <div className="flex flex-col gap-32">
          <h3 className="text-xl-bold text-neutral-900">
            {tds("resources.documentation", { count: nDocs })}
          </h3>
          <div className="grid grid-cols-12 gap-32">
            {docs.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={{ ...resource, type: "doc" }}
                className="col-span-12 lg:col-span-6"
              />
            ))}
          </div>
          <div className="mt-32 w-full max-w-[696px] self-center">
            <Pagination
              currentPage={docPage}
              onPageChange={(page) => setDocPage(page)}
              pageSize={ITEMS_PER_PAGE}
              totalItems={nDocs}
              isOnUrl={false}
            />
          </div>
        </div>
      )}

      {communityResources && nCom > 0 && (
        <div className="flex flex-col gap-32">
          <h3 className="text-xl-bold text-neutral-900">
            {tds("resources.comFiles", { count: nCom })}
          </h3>
          <div className="grid grid-cols-12 gap-32">
            {coms.map((resource) => {
              const author = getAuthorInfo(resource);
              return (
                <ResourceCard
                  key={resource.id}
                  resource={{...resource as unknown as Resource, type: "community"}}
                  authorName={author?.name}
                  authorUrl={author?.url}
                  isOrganization={author?.isOrg}
                  className="col-span-12 lg:col-span-6"
                />
              );
            })}
          </div>
          <div className="mt-32 w-full max-w-[696px] self-center">
            <Pagination
              currentPage={comPage}
              onPageChange={(page) => setComPage(page)}
              pageSize={ITEMS_PER_PAGE}
              totalItems={nDocs}
              isOnUrl={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};
