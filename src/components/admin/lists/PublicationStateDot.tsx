"use client";

import StatusDot from "@/components/admin/StatusDot";
import { useTranslation } from "react-i18next";

type StatusDotVariant =
  | "success"
  | "warning"
  | "danger"
  | "informative"
  | "neutral"
  | "primary"
  | "secondary";

type PublicationLabels = {
  deleted: string;
  archived: string;
  private: string;
  public: string;
};

type PublicationVariants = {
  deleted: StatusDotVariant;
  archived: StatusDotVariant;
  private: StatusDotVariant;
  public: StatusDotVariant;
};

type PublicationStateFlag = boolean | string | null | undefined;

type PublicationStateDotProps = {
  deleted?: PublicationStateFlag;
  archived?: PublicationStateFlag;
  isPrivate?: PublicationStateFlag;
  labels?: Partial<PublicationLabels>;
  variants?: Partial<PublicationVariants>;
};

const DEFAULT_VARIANTS: PublicationVariants = {
  deleted: "danger",
  archived: "neutral",
  private: "warning",
  public: "success",
};

export default function PublicationStateDot({
  deleted = false,
  archived = false,
  isPrivate = false,
  labels,
  variants,
}: PublicationStateDotProps) {
  const { t } = useTranslation("admin-common");
  const defaultLabels: PublicationLabels = {
    deleted: t("status.deleted"),
    archived: t("status.archived"),
    private: t("status.draft"),
    public: t("status.public"),
  };
  const mergedLabels = { ...defaultLabels, ...labels };
  const mergedVariants = { ...DEFAULT_VARIANTS, ...variants };
  const deletedFlag = Boolean(deleted);
  const archivedFlag = Boolean(archived);
  const privateFlag = Boolean(isPrivate);

  if (deletedFlag) {
    return <StatusDot variant={mergedVariants.deleted}>{mergedLabels.deleted}</StatusDot>;
  }
  if (archivedFlag) {
    return <StatusDot variant={mergedVariants.archived}>{mergedLabels.archived}</StatusDot>;
  }
  if (privateFlag) {
    return <StatusDot variant={mergedVariants.private}>{mergedLabels.private}</StatusDot>;
  }
  return <StatusDot variant={mergedVariants.public}>{mergedLabels.public}</StatusDot>;
}
