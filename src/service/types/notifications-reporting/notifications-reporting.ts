import type { Organization, UserRef } from "@/service/types/identity";
import type { TransferRecipientClass, TransferSubjectClass } from "@/service/types/transfer-system";

export interface DiscussionNotificationDetails {
  discussion: string | null;
  status: string | null;
  message_id: string | null;
}

export interface MembershipRequestNotificationDetails {
  request_organization: Organization | null;
  request_user: UserRef | null;
}

export interface TransferRequestNotificationDetails {
  transfer_owner: TransferNotificationPerson | null;
  transfer_recipient: TransferNotificationPerson | null;
  transfer_subject: {
    class: TransferSubjectClass;
    id: string;
    title?: string;
    slug?: string;
  } | null;
}

interface TransferNotificationPerson {
  class: TransferRecipientClass;
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
}

export interface ValidateHarvesterNotificationSource {
  id: string;
  name: string;
  slug: string;
}

export interface ValidateHarvesterNotificationDetails {
  source: ValidateHarvesterNotificationSource | null;
  status: "pending" | "accepted" | "refused";
}

export type NotificationDetails =
  | DiscussionNotificationDetails
  | MembershipRequestNotificationDetails
  | TransferRequestNotificationDetails
  | ValidateHarvesterNotificationDetails;

export interface Notification {
  id: string;
  created_at: string;
  last_modified: string;
  handled_at: string | null;
  user: UserRef | null;
  details: NotificationDetails;
}

export interface ReportReason {
  value: string;
  label: string;
}

export interface ReportCreatePayload {
  subject: { class: string; id: string };
  reason: string;
  message?: string;
}

export interface Report {
  id: string;
  by: UserRef | null;
  subject: { class: string; id: string };
  reason: string;
  message: string | null;
  reported_at: string;
  dismissed_at: string | null;
  dismissed_by: UserRef | null;
  subject_deleted_at: string | null;
  self_api_url: string;
}
