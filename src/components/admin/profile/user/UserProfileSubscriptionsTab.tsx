"use client";

import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Avatar, CardNoResults, Icon } from "@ama-pt/agora-design-system";
import type { UserFollowing } from "@/service/types/identity";

interface UserProfileSubscriptionsTabProps {
  subscriptions: UserFollowing[];
  isLoading: boolean;
}

const classToPath: Record<string, string> = {
  Dataset: "/datasets",
  Organization: "/organizations",
  Reuse: "/reuses",
  User: "/users",
};

export default function UserProfileSubscriptionsTab({
  subscriptions,
  isLoading,
}: UserProfileSubscriptionsTabProps) {
  const { t } = useTranslation("admin-profile");

  if (isLoading) {
    return (
      <div className="mt-24">
        <p className="text-base text-neutral-900">{t("subscriptions.loading")}</p>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="mt-24">
        <CardNoResults
          className="admin-page__empty"
          position="center"
          icon={<Icon name="agora-line-bell" className="icon-xl h-12 w-12 text-primary-500" />}
          title={t("subscriptions.emptyTitle")}
          description={t("subscriptions.emptyDescription")}
          hasAnchor={false}
        />
      </div>
    );
  }

  return (
    <div className="mt-24 flex flex-col gap-16">
      {subscriptions.map((subscription) => {
        const subscriptionName =
          subscription.following.name || subscription.following.title || "";
        const subscriptionAvatar =
          subscription.following.avatar_thumbnail || subscription.following.image_thumbnail;
        const initials = subscriptionName
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase())
          .slice(0, 2)
          .join("");
        const basePath = classToPath[subscription.following.class];
        const href =
          basePath && subscription.following.slug
            ? `${basePath}/${subscription.following.slug}`
            : null;

        const content = (
          <div className="flex items-center gap-16">
            <Avatar
              avatarType={subscriptionAvatar ? "image" : "initials"}
              srcPath={(subscriptionAvatar || initials) as unknown as undefined}
              alt={subscriptionName}
              className="h-48 w-48"
            />
            <span className="text-base font-medium text-neutral-900">{subscriptionName}</span>
          </div>
        );

        return href ? (
          <Link key={subscription.id} href={href} className="transition-opacity hover:opacity-80">
            {content}
          </Link>
        ) : (
          <div key={subscription.id}>{content}</div>
        );
      })}
    </div>
  );
}
