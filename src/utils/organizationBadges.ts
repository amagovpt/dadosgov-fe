// Organization badges (etiquetas) assigned in the backoffice. Shared PT labels
// used both by the organization filters and by the frontoffice badge display
// so they stay consistent. Kinds match the backend
// (udata/core/organization/constants.py).

export const ORGANIZATION_BADGE_LABELS: Record<string, string> = {
  "public-service": "Serviço público",
  certified: "Certificado",
  association: "Associação",
  company: "Empresa",
  "local-authority": "Autoridade local",
};

/** Human-readable PT label for a badge kind (falls back to the raw kind). */
export function organizationBadgeLabel(kind: string): string {
  return ORGANIZATION_BADGE_LABELS[kind] ?? kind;
}
