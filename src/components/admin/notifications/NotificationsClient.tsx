"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Breadcrumb,
  Button,
  CardNoResults,
  Icon,
} from "@ama-pt/agora-design-system";
import { fetchNotifications, markNotificationRead } from "@/app/api/notifications";
import type { Notification, ValidateHarvesterNotificationDetails } from '@/service/types/notifications-reporting';
import {
  harvesterValidationLink,
  isHarvesterValidation,
} from "@/components/admin/notifications/notification-helpers";

const STATUS_LABEL: Record<
  ValidateHarvesterNotificationDetails["status"],
  string
> = {
  pending: "Pendente",
  accepted: "Validada",
  refused: "Recusada",
};

export default function NotificationsClient() {
  const [items, setItems] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchNotifications(1, 50);
      setItems(res.data ?? []);
    } catch (error) {
      console.error("Error loading notifications:", error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkRead = useCallback(async (id: string) => {
    try {
      const updated = await markNotificationRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: "Notificações", url: "/pages/admin/notificacoes" },
          ]}
        />
      </div>

      <h1 className="admin-page__title mt-64 mb-16">Notificações</h1>
      <p className="text-neutral-700 text-base mb-32">
        Pedidos de validação de harvesters e outras notificações dirigidas à
        equipa de administração.
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
              className={`rounded-8 border border-neutral-200 p-24 flex flex-col gap-12 ${
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
    </div>
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
          <Icon name="agora-line-mega-phone" className="w-[20px] h-[20px]" />
          <span className="text-base font-medium text-primary-900">
            Validação de harvester — {statusLabel}
          </span>
        </div>
        {details.source ? (
          <p className="text-neutral-900 text-base">{details.source.name}</p>
        ) : (
          <p className="text-neutral-700 text-base italic">
            Fonte indisponível (poderá ter sido eliminada).
          </p>
        )}
        <p className="text-sm text-neutral-500">
          {format(new Date(createdAt), "dd/MM/yyyy HH:mm")}
          {handledAt && " · lida"}
        </p>
      </div>
      <div className="flex items-center gap-8 shrink-0">
        {link && (
          <Link href={link}>
            <Button appearance="outline" variant="primary">
              Ver harvester
            </Button>
          </Link>
        )}
        {!handledAt && (
          <Button
            appearance="link"
            variant="neutral"
            onClick={() => onMarkRead(id)}
          >
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
          <Icon name="agora-line-mega-phone" className="w-[20px] h-[20px]" />
          <span className="text-base font-medium text-primary-900">
            Nova notificação
          </span>
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
