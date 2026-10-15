"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { Button, CardNoResults, Icon } from "@ama-pt/agora-design-system";
import AdminLayout from "@/components/Layout/AdminLayout";
import { fetchNotifications, markNotificationRead } from "@/service/api/notifications";
import { fetchTransfers } from "@/service/api/transfers";
import type { Transfer } from "@/service/types/transfer-system";
import type {
  Notification,
  ValidateHarvesterNotificationDetails,
} from "@/service/types/notifications-reporting";
import {
  getHarvesterValidationStatus,
  harvesterValidationLink,
  isHarvesterValidation,
  isTransferRequest,
} from "@/components/admin/notifications/notification-helpers";
import TransferNotificationRow from "@/components/admin/notifications/TransferNotificationRow";
import AppIcon from "@/components/Primitives/AppIcon";
import TextLink from "@/components/Primitives/TextLink";
import { useApiErrorHandler } from "@/providers/ApiErrorProvider";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import type { BoNotificationsPage } from "@/service/types/admin/notifications";

interface NotificationsClientProps {
  pageContent: BoNotificationsPage;
}

export default function NotificationsClient({ pageContent }: NotificationsClientProps) {
  const { t } = useTranslation(["admin-common", "admin-notifications"]);
  const { notifyApiError } = useApiErrorHandler();
  const [items, setItems] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const initialNotificationRequest = useRef<ReturnType<typeof fetchNotifications> | null>(null);
  // Share each recipient's request across all rows and Strict Mode effects.
  // Keep rejected promises too: only an explicit retry should issue another
  // request after a failure such as a rate limit. This cache lives on the page.
  const recipientTransferRequests = useRef(new Map<string, Promise<Transfer[]>>());
  const loadRecipientTransfers = useCallback((recipient: string) => {
    const existing = recipientTransferRequests.current.get(recipient);
    if (existing) return existing;
    const request = fetchTransfers(recipient);
    recipientTransferRequests.current.set(recipient, request);
    return request;
  }, []);
  const retryRecipientTransfers = useCallback((recipient: string) => {
    recipientTransferRequests.current.delete(recipient);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadNotifications = async () => {
      setIsLoading(true);
      try {
        const res = await (initialNotificationRequest.current ??= fetchNotifications(1, 50));
        if (!isCancelled) {
          setItems(res.data ?? []);
        }
      } catch (error) {
        console.error("Error loading notifications:", error);
        if (!isCancelled) {
          setItems([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadNotifications();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleMarkRead = useCallback(
    async (id: string) => {
      try {
        const updated = await markNotificationRead(id);
        setItems((prev) => prev.map((n) => (n.id === id ? updated : n)));
      } catch (error) {
        // The button used to do nothing at all on failure — the notification
        // simply stayed unread with no explanation.
        console.error("Error marking notification as read:", error);
        notifyApiError(error);
      }
    },
    [notifyApiError]
  );

  return (
    <AdminLayout
      breadcrumbItems={[{ label: t("admin-notifications:title"), url: "/admin/notificacoes" }]}
      title={pageContent.hero?.title ?? ""}
      headerAction={null}
    >
      <div className="mb-32 text-base text-neutral-700">
        {formatHtmlParagraphs(pageContent.intro?.description ?? "")}
      </div>

      {isLoading ? (
        <p className="text-neutral-700">{t("admin-common:loading")}</p>
      ) : items.length === 0 ? (
        <CardNoResults
          title={pageContent.noResults?.title ?? ""}
          description={pageContent.noResults?.description ?? ""}
          hasAnchor={false}
        />
      ) : (
        <ul className="flex flex-col gap-16">
          {items.map((n) => (
            <li
              key={n.id}
              className={`flex flex-col gap-12 rounded-8 border border-neutral-200 p-24 ${
                n.handled_at ? "bg-neutral-50" : "bg-white"
              }`}
            >
              {isHarvesterValidation(n.details) ? (
                <HarvesterValidationRow createdAt={n.created_at} details={n.details} />
              ) : isTransferRequest(n.details) ? (
                <TransferNotificationRow
                  createdAt={n.created_at}
                  details={n.details}
                  loadTransfers={loadRecipientTransfers}
                  onRetryTransfers={retryRecipientTransfers}
                  onResponded={(respondedAt) => {
                    setItems((previous) =>
                      previous.map((item) =>
                        item.id === n.id ? { ...item, handled_at: respondedAt } : item
                      )
                    );
                  }}
                />
              ) : (
                <GenericRow
                  id={n.id}
                  createdAt={n.created_at}
                  handledAt={n.handled_at}
                  onMarkRead={handleMarkRead}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </AdminLayout>
  );
}

interface BaseRowProps {
  id: string;
  createdAt: string;
  handledAt: string | null;
  onMarkRead: (id: string) => void;
}

interface HarvesterRowProps {
  createdAt: string;
  details: ValidateHarvesterNotificationDetails;
}

function HarvesterValidationRow({ createdAt, details }: HarvesterRowProps) {
  const { t } = useTranslation("admin-notifications");
  const link = harvesterValidationLink(details);
  const validationStatus = getHarvesterValidationStatus(details);
  const owner = details.source?.owner;
  const senderName =
    details.source?.organization?.name ||
    [owner?.first_name, owner?.last_name].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col justify-between gap-16 md:flex-row md:items-start">
      <div className="flex min-w-0 flex-col gap-8">
        <div className="flex items-center gap-8">
          <AppIcon name="agora-line-mega-phone" />
          <span className="text-base font-medium text-primary-900">
            {t("harvesterValidation.title")}
          </span>
        </div>
        {details.source ? (
          <p className="text-base text-neutral-900">{details.source.name}</p>
        ) : (
          <p className="text-base text-neutral-700 italic">
            {t("harvesterValidation.sourceUnavailable")}
          </p>
        )}
        {link && (
          <TextLink href={link} target="_blank" className="inline-flex w-fit items-center gap-8">
            <AppIcon name="agora-line-eye" />
            {t("harvesterValidation.viewHarvester")}
          </TextLink>
        )}
        {senderName && (
          <p className="text-base text-neutral-700">
            {t("harvesterValidation.from", { owner: senderName })}
          </p>
        )}
        <p className="text-sm text-neutral-500">
          {format(new Date(createdAt), "dd/MM/yyyy HH:mm")}
        </p>
        {validationStatus !== "pending" && (
          <p role="status" className="text-sm text-neutral-700">
            {t(`harvesterValidation.statuses.${validationStatus}`)}
          </p>
        )}
      </div>
    </div>
  );
}

function GenericRow({ id, createdAt, handledAt, onMarkRead }: BaseRowProps) {
  const { t } = useTranslation("admin-notifications");

  return (
    <div className="flex items-start justify-between gap-16">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-8">
          <Icon name="agora-line-mega-phone" className="h-20 w-20" />
          <span className="text-base font-medium text-primary-900">{t("generic.title")}</span>
        </div>
        <p className="text-sm text-neutral-500">
          {format(new Date(createdAt), "dd/MM/yyyy HH:mm")}
          {handledAt && ` · ${t("read")}`}
        </p>
      </div>
      {!handledAt && (
        <Button appearance="link" variant="neutral" onClick={() => onMarkRead(id)}>
          {t("markAsRead")}
        </Button>
      )}
    </div>
  );
}
