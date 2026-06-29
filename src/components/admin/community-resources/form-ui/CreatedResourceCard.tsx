"use client";

import { Button, CardLinks, Icon } from "@ama-pt/agora-design-system";
import type { CommunityResource } from "@/service/types/community-resource";

interface CreatedResourceCardProps {
  resource: CommunityResource;
}

export default function CreatedResourceCard({ resource }: CreatedResourceCardProps) {
  return (
    <>
      <CardLinks
        onClick={() => {}}
        className="cursor-pointer text-neutral-900"
        variant="transparent"
        category={resource.format ? resource.format.toUpperCase() : "Recurso"}
        title={<div className="text-xl-bold underline">{resource.title}</div>}
        description={
          <div className="mt-8 flex flex-col gap-4 pb-32">
            <p className="text-sm text-neutral-900">
              Atualizado hoje
              {resource.format ? ` –  ${resource.format.toUpperCase()}` : ""}
              {resource.filesize
                ? ` (${
                    resource.filesize >= 1048576
                      ? (resource.filesize / 1048576).toFixed(1).replace(".", ",") + " MB"
                      : resource.filesize >= 1024
                        ? (resource.filesize / 1024).toFixed(1).replace(".", ",") + " KB"
                        : resource.filesize + " B"
                  })`
                : ""}
            </p>
            {resource.url && (
              <p className="text-sm mt-8 flex items-center gap-8 text-neutral-900">
                <Icon name="agora-line-map-pin" className="h-16 w-16" />
                Localização:{" "}
                {(() => {
                  try {
                    return new URL(resource.url).hostname;
                  } catch {
                    return resource.url;
                  }
                })()}
              </p>
            )}
            {resource.checksum && (
              <p className="text-sm mt-8 flex items-center gap-8 text-neutral-900">
                <Icon name="agora-line-code" className="h-16 w-16" />
                Soma de verificação: {resource.checksum.value}
              </p>
            )}
          </div>
        }
        date={<span className="font-[300]">Atualizado hoje</span>}
        blockedLink={true}
      />
      <div className="admin-page__actions mt-8 flex justify-end gap-[18px]">
        {resource.dataset?.page && (
          <Button
            appearance="link"
            variant="primary"
            hasIcon
            trailingIcon="agora-line-external-link"
            trailingIconHover="agora-solid-external-link"
            onClick={() => window.open(resource.dataset!.page, "_blank")}
          >
            Ver na página pública
          </Button>
        )}
      </div>
    </>
  );
}
