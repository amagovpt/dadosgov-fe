import type {
  Notification,
  NotificationDetails,
  ValidateHarvesterNotificationDetails,
} from "@/service/types/api";

/**
 * Type-guard for the harvester-validation notification variant. Lets us safely
 * narrow `Notification` so the UI can branch by notification type without
 * scattering `as` casts.
 */
export function isHarvesterValidation(
  details: NotificationDetails
): details is ValidateHarvesterNotificationDetails {
  return (
    details !== null &&
    typeof details === "object" &&
    "status" in details &&
    "source" in details
  );
}

/**
 * Count notifications whose backend status is still `pending` AND that have
 * not been marked as handled in the frontend yet (`handled_at === null`).
 * Falsy values protect against half-loaded payloads.
 */
export function countPendingHarvesterValidations(
  notifications: Notification[]
): number {
  return notifications.filter(
    (n) =>
      n.handled_at === null &&
      isHarvesterValidation(n.details) &&
      n.details.status === "pending"
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
  if (!details.source?.slug) return null;
  return `/pages/admin/system/harvesters/${details.source.slug}`;
}
