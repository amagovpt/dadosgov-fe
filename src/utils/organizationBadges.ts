// Organization badges (etiquetas) assigned in the backoffice. Shared metadata
// used both by the organization filters and by the frontoffice badge display
// so labels stay consistent. Kinds match the backend
// (udata/core/organization/constants.py).

import type { Pill } from "@ama-pt/agora-design-system";

type PillVariant = NonNullable<React.ComponentProps<typeof Pill>["variant"]>;

export interface OrganizationBadgeMeta {
  label: string;
  variant: PillVariant;
}

export const ORGANIZATION_BADGE_META: Record<string, OrganizationBadgeMeta> = {
  "public-service": { label: "Serviço público", variant: "primary" },
  certified: { label: "Certificado", variant: "success" },
  association: { label: "Associação", variant: "neutral" },
  company: { label: "Empresa", variant: "neutral" },
  "local-authority": { label: "Autoridade local", variant: "neutral" },
};

/** Human-readable PT label for a badge kind (falls back to the raw kind). */
export function organizationBadgeLabel(kind: string): string {
  return ORGANIZATION_BADGE_META[kind]?.label ?? kind;
}
