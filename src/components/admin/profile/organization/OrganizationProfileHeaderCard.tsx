"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, Icon } from "@ama-pt/agora-design-system";
import type { Organization } from "@/service/types/identity";

interface OrganizationProfileHeaderCardProps {
  organization: Organization;
  logoPreview: string | null;
}

export default function OrganizationProfileHeaderCard({
  organization,
  logoPreview,
}: OrganizationProfileHeaderCardProps) {
  const router = useRouter();

  return (
    <div className="profile-card">
      {organization.slug && (
        <div className="absolute right-32 top-32">
          <Button
            variant="primary"
            appearance="outline"
            className="bg-white"
            hasIcon
            leadingIcon="agora-line-eye"
            leadingIconHover="agora-solid-eye"
            onClick={() => router.push(`/organizations/${organization.slug}`)}
          >
            Ver perfil público
          </Button>
        </div>
      )}
      <div className="profile-card__avatar-container">
        {logoPreview || organization.logo_thumbnail ? (
          <img
            src={logoPreview ?? organization.logo_thumbnail!}
            alt={organization.name}
            className="profile-card__avatar-img"
          />
        ) : (
          <Avatar
            avatarType="initials"
            srcPath={(organization.name?.charAt(0).toUpperCase() || "O") as unknown as undefined}
            alt={organization.name}
            className="profile-card__avatar"
          />
        )}
      </div>

      <div className="profile-card__body">
        <div className="profile-card__info">
          <p className="text-xl font-semibold leading-8 text-neutral-900">{organization.name}</p>
          {organization.acronym && (
            <p className="text-base font-light leading-7 text-neutral-900">{organization.acronym}</p>
          )}
          <div className="flex items-center gap-16 text-sm text-neutral-900">
            <span className="flex items-center gap-4">
              <Icon name="agora-line-user-group" className="h-16 w-16" />
              {organization.metrics.members} membros
            </span>
            <span className="flex items-center gap-4">
              <Icon name="agora-line-layers-menu" className="h-16 w-16" />
              {organization.metrics.datasets} conjuntos de dados
            </span>
            <span className="flex items-center gap-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="text-primary-500"
              >
                <path
                  d="M4 22.9091V15.2727C4 14.6702 4.47969 14.1818 5.07143 14.1818C5.66316 14.1818 6.14286 14.6702 6.14286 15.2727V22.9091C6.14286 23.5116 5.66316 24 5.07143 24C4.47969 24 4 23.5116 4 22.9091ZM10.4286 22.9091V1.09091C10.4286 0.488417 10.9083 0 11.5 0C12.0917 0 12.5714 0.488417 12.5714 1.09091V22.9091C12.5714 23.5116 12.0917 24 11.5 24C10.9083 24 10.4286 23.5116 10.4286 22.9091ZM16.8571 22.9091V9.81818C16.8571 9.21569 17.3368 8.72727 17.9286 8.72727C18.5203 8.72727 19 9.21569 19 9.81818V22.9091C19 23.5116 18.5203 24 17.9286 24C17.3368 24 16.8571 23.5116 16.8571 22.9091Z"
                  fill="currentColor"
                />
              </svg>
              {organization.metrics.reuses} reutilizações
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
