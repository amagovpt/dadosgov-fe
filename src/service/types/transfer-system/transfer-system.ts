import type { UserRef } from '@/service/types/identity';

export type TransferStatus = "pending" | "accepted" | "refused";

export type TransferSubjectClass = "Dataset" | "Reuse" | "Dataservice";

export type TransferRecipientClass = "User" | "Organization";

export interface TransferRef {
  class: string;
  id: string;
}

export interface Transfer {
  id: string;
  user?: UserRef | null;
  owner?: UserRef | { id: string; name: string; slug: string } | null;
  recipient?: UserRef | { id: string; name: string; slug: string } | null;
  subject?: { id: string; title?: string; slug?: string } | null;
  comment: string;
  response_comment?: string | null;
  status: TransferStatus;
  created: string;
  responded?: string | null;
}

export interface TransferRequestPayload {
  subject: { class: TransferSubjectClass; id: string };
  recipient: { class: TransferRecipientClass; id: string };
  comment?: string;
}

export interface SystemLogFile {
  name: string;
  size: number;
  modified: string;
}

export interface SystemLogContent extends SystemLogFile {
  truncated: boolean;
  content: string;
}

