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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filePage, setFilePage] = useState<number>(1);
  const [docPage, setDocPage] = useState<number>(1);

  const documentationFiles = resources.filter((r) => r.type === "documentation");
  const principalFiles = resources.filter((r) => r.type !== "documentation");

  const nFiles = principalFiles.length;
  const nDocs = documentationFiles.length;

  const files = principalFiles.slice(ITEMS_PER_PAGE * (filePage - 1), ITEMS_PER_PAGE * filePage);
  const docs = documentationFiles.slice(ITEMS_PER_PAGE * (docPage - 1), ITEMS_PER_PAGE * docPage);

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

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
            {tds("resources.mainFiles", { count: principalFiles.length })}
          </h3>
          <div className="grid grid-cols-12 gap-32">
            {files.map((resource) => (
              <div key={resource.id} className="col-span-12 lg:col-span-6">
                <ResourceCard
                  resource={resource}
                  isExpanded={expandedId === resource.id}
                  onToggle={() => handleToggle(resource.id)}
                />
              </div>
            ))}
          </div>
          <div className="mt-32">
            <Pagination
              currentPage={filePage}
              onPageChange={(page) => setFilePage(page)}
              pageSize={ITEMS_PER_PAGE}
              totalItems={nFiles}
            />
          </div>
        </div>
      )}

      {nDocs > 0 && (
        <div className="flex flex-col gap-32">
          <h3 className="text-base font-medium text-neutral-900">
            {tds("resources.documentation", { count: documentationFiles.length })}
          </h3>
          <div className="grid grid-cols-12 gap-32">
            {docs.map((resource) => (
              <div key={resource.id} className="col-span-12 lg:col-span-6">
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  isExpanded={expandedId === resource.id}
                  onToggle={() => handleToggle(resource.id)}
                />
              </div>
            ))}
          </div>
          <div className="mt-32">
            <Pagination
              currentPage={docPage}
              onPageChange={(page) => setDocPage(page)}
              pageSize={ITEMS_PER_PAGE}
              totalItems={nDocs}
            />
          </div>
        </div>
      )}

      {communityResources && communityResources.length > 0 && (
        <div className="flex flex-col">
          {communityResources.map((cr) => {
            const author = getAuthorInfo(cr);
            return (
              <ResourceCard
                key={cr.id}
                resource={cr as unknown as Resource}
                isExpanded={expandedId === cr.id}
                onToggle={() => handleToggle(cr.id)}
                authorName={author?.name}
                authorUrl={author?.url}
                isOrganization={author?.isOrg}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
