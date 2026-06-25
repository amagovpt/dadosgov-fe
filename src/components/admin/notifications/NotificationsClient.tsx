"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Button, CardNoResults, Icon } from "@ama-pt/agora-design-system";
import AdminLayout from "@/components/Layout/AdminLayout";
import { fetchNotifications, markNotificationRead } from "@/service/api/notifications";
import type { Notification, ValidateHarvesterNotificationDetails } from "@/service/types/notifications-reporting";
import {
  harvesterValidationLink,
  isHarvesterValidation,
} from "@/components/admin/notifications/notification-helpers";
import AppIcon from "@/components/Primitives/AppIcon";

const STATUS_LABEL: Record<ValidateHarvesterNotificationDetails["status"], string> = {
  pending: "Pendente",
  accepted: "Validada",
  refused: "Recusada",
};

export default function NotificationsClient() {
  const [items, setItems] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const loadNotifications = async () => {
      setIsLoading(true);
      try {
        const res = await fetchNotifications(1, 50);
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

  const handleMarkRead = useCallback(async (id: string) => {
    try {
      const updated = await markNotificationRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: "Administração", url: "/pages/admin" },
        { label: "Notificações", url: "/pages/admin/notificacoes" },
      ]}
      title="Notificações"
      headerAction={null}
    >
      <p className="mb-32 text-base text-neutral-700">
        Pedidos de validação de harvesters e outras notificações dirigidas à equipa de
        administração.
      </p>

      {isLoading ? (
        <p className="text-neutral-700">A carregar…</p>
      ) : items.length === 0 ? (
        <CardNoResults>
          <p>Sem notificações de momento.</p>
        </CardNoResults>
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
                <HarvesterValidationRow
                  id={n.id}
                  createdAt={n.created_at}
                  handledAt={n.handled_at}
                  details={n.details}
                  onMarkRead={handleMarkRead}
                />
              ) : (
                // Other notification types (Discussion, Membership, Transfer)
                // are out of scope for LEDG-1735. Fallback ensures they still
                // render and can be dismissed.
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

interface HarvesterRowProps extends BaseRowProps {
  details: ValidateHarvesterNotificationDetails;
}

function HarvesterValidationRow({
  id,
  createdAt,
  handledAt,
  details,
  onMarkRead,
}: HarvesterRowProps) {
  const link = harvesterValidationLink(details);
  const statusLabel = STATUS_LABEL[details.status] ?? details.status;

  return (
    <div className="flex items-start justify-between gap-16">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-8">
          <AppIcon name="agora-line-mega-phone" />
          <span className="text-base font-medium text-primary-900">
            Validação de harvester — {statusLabel}
          </span>
        </div>
        {details.source ? (
          <p className="text-base text-neutral-900">{details.source.name}</p>
        ) : (
          <p className="text-base italic text-neutral-700">
            Fonte indisponível (poderá ter sido eliminada).
          </p>
        )}
        <p className="text-sm text-neutral-500">
          {format(new Date(createdAt), "dd/MM/yyyy HH:mm")}
          {handledAt && " · lida"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-8">
        {link && (
          <Link href={link}>
            <Button appearance="outline" variant="primary">
              Ver harvester
            </Button>
          </Link>
        )}
        {!handledAt && (
          <Button appearance="link" variant="neutral" onClick={() => onMarkRead(id)}>
            Marcar como lida
          </Button>
        )}
      </div>
    </div>
  );
}

function GenericRow({ id, createdAt, handledAt, onMarkRead }: BaseRowProps) {
  return (
    <div className="flex items-start justify-between gap-16">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-8">
          <Icon name="agora-line-mega-phone" className="h-20 w-20" />
          <span className="text-base font-medium text-primary-900">Nova notificação</span>
        </div>
        <p className="text-sm text-neutral-500">
          {format(new Date(createdAt), "dd/MM/yyyy HH:mm")}
          {handledAt && " · lida"}
        </p>
      </div>
      {!handledAt && (
        <Button appearance="link" variant="neutral" onClick={() => onMarkRead(id)}>
          Marcar como lida
        </Button>
      )}
    </div>
  );
}
