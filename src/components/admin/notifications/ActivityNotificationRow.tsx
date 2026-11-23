"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import AppIcon from "@/components/Primitives/AppIcon";
import TextLink from "@/components/Primitives/TextLink";
import { i18nConfig } from "@/config/i18nConfig";
import { getDiscussionHref } from "@/utils/discussionLinks";
import { getNotificationDiscussionId, isMembershipRequest } from "./notification-helpers";
import type { Discussion } from "@/service/types/discussion";
import type {
  DiscussionNotificationDetails,
  MembershipRequestNotificationDetails,
  MembershipResponseNotificationDetails,
} from "@/service/types/notifications-reporting";

interface NotificationRowProps {
  createdAt: string;
  readAction: ReactNode;
}

function NotificationSummary({
  createdAt,
  readAction,
  title,
  children,
}: NotificationRowProps & { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-16 md:flex-row md:items-start">
      <div className="flex min-w-0 flex-col gap-8 wrap-anywhere">
        <div className="flex items-center gap-8">
          <AppIcon name="agora-line-mega-phone" />
          <span className="text-base font-medium text-primary-900">{title}</span>
        </div>
        {children}
        <p className="text-sm text-neutral-500">
          {format(new Date(createdAt), "dd/MM/yyyy HH:mm")}
        </p>
      </div>
      {readAction && <div className="shrink-0 self-end">{readAction}</div>}
    </div>
  );
}

export function DiscussionNotificationRow({
  details,
  loadDiscussion,
  ...rowProps
}: NotificationRowProps & {
  details: DiscussionNotificationDetails;
  loadDiscussion: (id: string) => Promise<Discussion | null>;
}) {
  const { t, i18n } = useTranslation("admin-notifications");
  const router = useRouter();
  const id = getNotificationDiscussionId(details.discussion);
  const opening = useRef(false);
  const [hasFailed, setHasFailed] = useState(false);

  const event =
    details.status === "new_discussion"
      ? "new"
      : details.status === "new_comment"
        ? "comment"
        : details.status === "closed"
          ? "closed"
          : "updated";
  const locale =
    (i18n.resolvedLanguage || i18n.language)?.split("-")[0] || i18nConfig.defaultLocale;

  async function handleViewDiscussion() {
    if (!id || opening.current) return;
    opening.current = true;
    setHasFailed(false);

    try {
      const discussion = await loadDiscussion(id);
      const href = discussion ? getDiscussionHref(discussion) : null;
      if (href) {
        router.push(`/${locale}${href}`);
      } else {
        setHasFailed(true);
      }
    } catch {
      setHasFailed(true);
    } finally {
      opening.current = false;
    }
  }

  return (
    <NotificationSummary {...rowProps} title={t(`discussion.${event}`)}>
      {(!id || hasFailed) && (
        <p role="status" className="text-sm text-neutral-700">
          {t("discussion.unavailable")}
        </p>
      )}
      {id && (
        <button
          type="button"
          onClick={handleViewDiscussion}
          className="inline-flex w-fit items-center gap-8 text-primary-600 underline"
        >
          <AppIcon name="agora-line-eye" />
          {t("discussion.view")}
        </button>
      )}
    </NotificationSummary>
  );
}

export function MembershipNotificationRow({
  details,
  ...rowProps
}: NotificationRowProps & {
  details: MembershipRequestNotificationDetails | MembershipResponseNotificationDetails;
}) {
  const { t, i18n } = useTranslation("admin-notifications");
  const request = isMembershipRequest(details) ? details : null;
  const organization = isMembershipRequest(details)
    ? details.request_organization
    : details.organization;
  const event = isMembershipRequest(details)
    ? details.kind === "invitation"
      ? "invitation"
      : "request"
    : details.class === "MembershipAcceptedNotificationDetails"
      ? "accepted"
      : "refused";
  const requester =
    request &&
    [request.request_user?.first_name, request.request_user?.last_name].filter(Boolean).join(" ");
  const locale =
    (i18n.resolvedLanguage || i18n.language)?.split("-")[0] || i18nConfig.defaultLocale;
  const href = organization?.id
    ? event === "request"
      ? `/${locale}/admin/org/${encodeURIComponent(organization.id)}/members`
      : `/${locale}/organizations/${encodeURIComponent(organization.slug || organization.id)}`
    : null;

  return (
    <NotificationSummary {...rowProps} title={t(`membership.${event}.title`)}>
      <p className="text-base text-neutral-900">
        {organization?.name || t("membership.organizationUnavailable")}
      </p>
      <p className="text-base text-neutral-700">{t(`membership.${event}.description`)}</p>
      {event === "request" && requester && (
        <p className="text-base text-neutral-700">{t("membership.from", { user: requester })}</p>
      )}
      {href && (
        <TextLink href={href} className="inline-flex w-fit items-center gap-8">
          <AppIcon name="agora-line-eye" />
          {t(event === "request" ? "membership.viewRequests" : "membership.viewOrganization")}
        </TextLink>
      )}
    </NotificationSummary>
  );
}
