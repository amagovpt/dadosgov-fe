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
  communityResources,
}) => {
  const { t: tds } = useTranslation("datasets");
  const [comPage, setComPage] = useState<number>(1);

  const nCom = communityResources.length;
  const coms = communityResources.slice(ITEMS_PER_PAGE * (comPage - 1), ITEMS_PER_PAGE * comPage);

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
      {nCom > 0 && (
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
                  resource={{ ...(resource as unknown as Resource), type: "community" }}
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
              totalItems={nCom}
              isOnUrl={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};
