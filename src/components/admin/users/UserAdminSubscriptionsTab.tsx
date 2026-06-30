"use client";

import React from "react";
import Link from "next/link";
import { Avatar, CardNoResults, Icon } from "@ama-pt/agora-design-system";
import type { UserFollowing } from "@/service/types/identity";

type UserAdminSubscriptionsTabProps = {
  subscriptions: UserFollowing[];
  isLoading: boolean;
};

const classToPath: Record<string, string> = {
  Dataset: "/datasets",
  Organization: "/organizations",
  Reuse: "/reuses",
  User: "/users",
};

export default function UserAdminSubscriptionsTab({
  subscriptions,
  isLoading,
}: UserAdminSubscriptionsTabProps) {
  return (
    <div className="mt-24">
      {isLoading ? (
        <p className="text-neutral-900 text-base">A carregar subscrições...</p>
      ) : subscriptions.length === 0 ? (
        <CardNoResults
          className="admin-page__empty"
          position="center"
          icon={<Icon name="agora-line-bell" className="w-12 h-12 text-primary-500 icon-xl" />}
          title="Sem subscrições"
          description="Não segue conteúdos"
          hasAnchor={false}
        />
      ) : (
        <div className="flex flex-col gap-16">
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
                  className="w-48 h-48"
                />
                <span className="text-neutral-900 text-base font-medium">{subscriptionName}</span>
              </div>
            );
            return href ? (
              <Link
                key={subscription.id}
                href={href}
                className="hover:opacity-80 transition-opacity"
              >
                {content}
              </Link>
            ) : (
              <div key={subscription.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
