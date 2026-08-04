"use client";

import { useTranslation } from "react-i18next";
import {
  Button,
  Icon,
  StatusCard,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@ama-pt/agora-design-system";
import TextLink from "@/components/Primitives/TextLink";
import type { MembershipRequest } from "@/service/types/identity";
import { formatDateToDMY } from "@/utils/formatDate";

interface PendingRequestsTableProps {
  requests: MembershipRequest[];
  requestAction: string | null;
  requestError: string | null;
  onAccept: (request: MembershipRequest) => void;
  onRefuse: (request: MembershipRequest) => void;
}

export function PendingRequestsTable({
  requests,
  requestAction,
  requestError,
  onAccept,
  onRefuse,
}: PendingRequestsTableProps) {
  const { t } = useTranslation("admin-members");

  return (
    <div className="mb-32">
      <h2 className="mb-16 text-base font-semibold text-neutral-900">
        {t("pendingRequests.title", { count: requests.length })}
      </h2>
      {requestError && (
        <div className="mb-16">
          <StatusCard variant="danger" showIcon description={requestError} />
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>{t("pendingRequests.user")}</TableHeaderCell>
            <TableHeaderCell>{t("pendingRequests.comment")}</TableHeaderCell>
            <TableHeaderCell>{t("pendingRequests.requestDate")}</TableHeaderCell>
            <TableHeaderCell>{t("pendingRequests.actions")}</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell headerLabel={t("pendingRequests.user")}>
                <div className="flex items-center gap-8">
                  {request.user.avatar_thumbnail ? (
                    <img
                      src={request.user.avatar_thumbnail}
                      alt={`${request.user.first_name} ${request.user.last_name}`}
                      className="h-32 w-32 rounded-full"
                    />
                  ) : (
                    <Icon name="agora-line-user" className="h-32 w-32" />
                  )}
                  <TextLink href={`/users/${request.user.slug}`}>
                    {request.user.first_name} {request.user.last_name}
                  </TextLink>
                </div>
              </TableCell>
              <TableCell headerLabel={t("pendingRequests.comment")}>
                {request.comment || "-"}
              </TableCell>
              <TableCell headerLabel={t("pendingRequests.requestDate")}>
                {formatDateToDMY(request.created)}
              </TableCell>
              <TableCell headerLabel={t("pendingRequests.actions")}>
                <div className="flex gap-8">
                  <Button
                    variant="primary"
                    appearance="link"
                    onClick={() => onAccept(request)}
                    disabled={requestAction === request.id}
                  >
                    <span className="underline">
                      {requestAction === request.id
                        ? t("pendingRequests.accepting")
                        : t("pendingRequests.accept")}
                    </span>
                  </Button>
                  <Button
                    variant="danger"
                    appearance="link"
                    onClick={() => onRefuse(request)}
                    disabled={requestAction === request.id}
                  >
                    <span className="underline">{t("pendingRequests.refuse")}</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
