import StatusDot from "@/components/admin/StatusDot";

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

type PublicationStateDotProps = {
  deleted?: boolean;
  archived?: boolean;
  isPrivate?: boolean;
  labels?: Partial<PublicationLabels>;
  variants?: Partial<PublicationVariants>;
};

const DEFAULT_LABELS: PublicationLabels = {
  deleted: "Excluído",
  archived: "Arquivado",
  private: "Rascunho",
  public: "Público",
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
  const mergedLabels = { ...DEFAULT_LABELS, ...labels };
  const mergedVariants = { ...DEFAULT_VARIANTS, ...variants };

  if (deleted) {
    return <StatusDot variant={mergedVariants.deleted}>{mergedLabels.deleted}</StatusDot>;
  }
  if (archived) {
    return <StatusDot variant={mergedVariants.archived}>{mergedLabels.archived}</StatusDot>;
  }
  if (isPrivate) {
    return <StatusDot variant={mergedVariants.private}>{mergedLabels.private}</StatusDot>;
  }
  return <StatusDot variant={mergedVariants.public}>{mergedLabels.public}</StatusDot>;
}
