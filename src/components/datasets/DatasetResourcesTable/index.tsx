"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { CommunityResource } from "@/service/types/community-resource";
import { Resource } from "@/service/types/dataset";
import { ResourceCard } from "./ResourceCard";
import { DatasetResourcesTableProps } from "./types";

export const DatasetResourcesTable: React.FC<DatasetResourcesTableProps> = ({
  resources,
  communityResources,
}) => {
  const { t: tds } = useTranslation("datasets");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const documentationFiles = resources.filter((r) => r.type === "documentation");
  const principalFiles = resources.filter((r) => r.type !== "documentation");

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
      {principalFiles.length > 0 && (
        <div className="space-y-16">
          <h3 className="font-medium text-neutral-900 text-base">
            {tds("resources.mainFiles", { count: principalFiles.length })}
          </h3>
          <div className="flex flex-col">
            {principalFiles.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                isExpanded={expandedId === resource.id}
                onToggle={() => handleToggle(resource.id)}
              />
            ))}
          </div>
        </div>
      )}

      {documentationFiles.length > 0 && (
        <div className="space-y-16 mt-16 mb-16">
          <h3 className="font-medium text-neutral-900 text-base">
            {tds("resources.documentation", { count: documentationFiles.length })}
          </h3>
          <div className="flex flex-col">
            {documentationFiles.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                isExpanded={expandedId === resource.id}
                onToggle={() => handleToggle(resource.id)}
              />
            ))}
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
