"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Avatar, Button } from "@ama-pt/agora-design-system";
import type { UserAdmin } from "@/service/types/identity";

type UserAdminHeaderCardProps = {
  user: UserAdmin;
  displayName: string;
  lastModified: string;
  onViewPublicProfile: () => void;
};

export default function UserAdminHeaderCard({
  user,
  displayName,
  lastModified,
  onViewPublicProfile,
}: UserAdminHeaderCardProps) {
  const { t } = useTranslation("admin-users");

  return (
    <div className="profile-card">
      <Avatar
        avatarType={user.avatar_thumbnail ? "image" : "initials"}
        srcPath={
          (user.avatar_thumbnail ||
            `${(user.first_name || "")[0] || ""}${(user.last_name || "")[0] || ""}`.toUpperCase()) as unknown as undefined
        }
        alt={displayName}
        className="profile-card__avatar"
      />

      <div className="profile-card__body">
        <div className="profile-card__info">
          {user.organizations?.[0] && (
            <p className="text-neutral-900 text-base font-light leading-7">
              {user.organizations[0].name}
            </p>
          )}
          <p className="text-neutral-900 text-xl font-semibold leading-8">{displayName}</p>
          {lastModified && (
            <p className="text-neutral-900 text-base leading-7">
              <span className="font-semibold">{t("headerCard.memberSince")}</span> {lastModified}
            </p>
          )}
        </div>

        <div className="absolute top-32 right-32">
          <Button
            variant="primary"
            appearance="outline"
            className="bg-white"
            hasIcon
            leadingIcon="agora-line-eye"
            leadingIconHover="agora-solid-eye"
            onClick={onViewPublicProfile}
          >
            {t("headerCard.viewPublicProfile")}
          </Button>
        </div>
      </div>
    </div>
  );
}
