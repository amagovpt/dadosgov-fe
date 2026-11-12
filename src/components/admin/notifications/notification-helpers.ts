import type {
  Notification,
  NotificationDetails,
  DiscussionNotificationDetails,
  MembershipRequestNotificationDetails,
  MembershipResponseNotificationDetails,
  TransferRequestNotificationDetails,
  ValidateHarvesterNotificationDetails,
} from "@/service/types/notifications-reporting";
import type { Transfer } from "@/service/types/transfer-system";

export function isDiscussionNotification(
  details: NotificationDetails
): details is DiscussionNotificationDetails {
  return details !== null && typeof details === "object" && "discussion" in details;
}

export function isMembershipRequest(
  details: NotificationDetails
): details is MembershipRequestNotificationDetails {
  return details !== null && typeof details === "object" && "request_organization" in details;
}

export function isMembershipResponse(
  details: NotificationDetails
): details is MembershipResponseNotificationDetails {
  return (
    details !== null &&
    typeof details === "object" &&
    "class" in details &&
    (details.class === "MembershipAcceptedNotificationDetails" ||
      details.class === "MembershipRefusedNotificationDetails")
  );
}

export function getNotificationDiscussionId(reference: string | null): string | null {
  // The API currently serializes references as Discussion(<ObjectId>).
  if (typeof reference !== "string") return null;
  const match = /^(?:Discussion\(([a-f\d]{24})\)|([a-f\d]{24}))$/i.exec(reference);
  return match?.[1] ?? match?.[2] ?? null;
}

export function isTransferRequest(
  details: NotificationDetails
): details is TransferRequestNotificationDetails {
  return (
    details !== null &&
    typeof details === "object" &&
    "transfer_owner" in details &&
    "transfer_recipient" in details &&
    "transfer_subject" in details
  );
}

// Notifications contain references, not the transfer ID. Match the original
// request timestamp too, so a later request for the same resource is never
// accepted from an older notification.
export function findNotificationTransfer(
  details: TransferRequestNotificationDetails,
  createdAt: string,
  transfers: Transfer[]
): Transfer | null {
  if (!details.transfer_owner || !details.transfer_recipient || !details.transfer_subject) {
    return null;
  }

  const matches = transfers.filter(
    (transfer) =>
      transfer.owner?.id === details.transfer_owner?.id &&
      transfer.recipient?.id === details.transfer_recipient?.id &&
      transfer.subject?.id === details.transfer_subject?.id &&
      Date.parse(transfer.created) === Date.parse(createdAt)
  );
  return matches.length === 1 ? matches[0] : null;
}

/**
 * Type-guard for the harvester-validation notification variant. Lets us safely
 * narrow `Notification` so the UI can branch by notification type without
 * scattering `as` casts.
 */
export function isHarvesterValidation(
  details: NotificationDetails
): details is ValidateHarvesterNotificationDetails {
  return (
    details !== null && typeof details === "object" && "status" in details && "source" in details
  );
}

export function getHarvesterValidationStatus(
  details: ValidateHarvesterNotificationDetails
): ValidateHarvesterNotificationDetails["status"] {
  // The notification records the original event. Its embedded source is
  // serialized with the harvester's current validation state.
  return details.source?.validation?.state ?? details.status;
}

/**
 * Count notifications whose current harvester state is still `pending` AND that have
 * not been marked as handled in the frontend yet (`handled_at === null`).
 * Falsy values protect against half-loaded payloads.
 */
export function countPendingHarvesterValidations(notifications: Notification[]): number {
  return notifications.filter(
    (n) =>
      n.handled_at === null &&
      isHarvesterValidation(n.details) &&
      getHarvesterValidationStatus(n.details) === "pending"
  ).length;
}

/**
 * Build the admin link for an item; returns null when the embedded source ref
 * is missing (orphan notification — backend cleans these up, but we are
 * defensive on the read path).
 */
export function harvesterValidationLink(
  details: ValidateHarvesterNotificationDetails
): string | null {
  if (!details.source?.id) return null;
  return `/admin/harvesters/${encodeURIComponent(details.source.id)}`;
}
