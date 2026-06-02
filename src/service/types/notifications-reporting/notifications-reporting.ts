import type { Organization, UserRef } from '@/service/types/identity';

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
  transfer_owner: object | null;
  transfer_recipient: object | null;
  transfer_subject: object | null;
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


