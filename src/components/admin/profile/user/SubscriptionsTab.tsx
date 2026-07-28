import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Avatar, CardNoResults, Icon } from "@ama-pt/agora-design-system";
import { UserFollowing } from "@/service/types/identity";

interface SubscriptionsTabProps {
  subscriptions: UserFollowing[];
  isLoading: boolean;
}

const CLASS_TO_PATH: Record<string, string> = {
  Dataset: "/datasets",
  Organization: "/organizations",
  Reuse: "/reuses",
  User: "/users",
};

export function SubscriptionsTab({ subscriptions, isLoading }: SubscriptionsTabProps) {
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
    <div className="mt-24">
      <div className="flex flex-col gap-16">
        {subscriptions.map((sub) => {
          const subName = sub.following.name || sub.following.title || "";
          const subAvatar = sub.following.avatar_thumbnail || sub.following.image_thumbnail;
          const initials = subName
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase())
            .slice(0, 2)
            .join("");
          const basePath = CLASS_TO_PATH[sub.following.class];
          const href =
            basePath && sub.following.slug ? `${basePath}/${sub.following.slug}` : null;

          const content = (
            <div className="flex items-center gap-16">
              <Avatar
                avatarType={subAvatar ? "image" : "initials"}
                srcPath={(subAvatar || initials) as unknown as undefined}
                alt={subName}
                className="h-48 w-48"
              />
              <span className="text-base font-medium text-neutral-900">{subName}</span>
            </div>
          );

          return href ? (
            <Link key={sub.id} href={href} className="transition-opacity hover:opacity-80">
              {content}
            </Link>
          ) : (
            <div key={sub.id}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
