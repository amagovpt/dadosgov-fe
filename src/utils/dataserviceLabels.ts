// Shared label maps for dataservice access metadata. Used both by the API
// registration/edit forms (as option lists) and by the public detail page (as
// lookup maps for display), so the wording stays consistent across the app.

// Access type, shown to end users as the access method / conditions.
export const ACCESS_TYPE_LABELS: Record<string, string> = {
  open: "Download gratuito",
  open_with_account: "Aberto sob certas condições",
  restricted: "Acesso mediante autorização",
};

// Short pill labels for the access type (mirrors the access conditions badge).
export const ACCESS_TYPE_PILL_LABELS: Record<string, string> = {
  open: "ABERTO",
  open_with_account: "ABERTO COM CONTA",
  restricted: "RESTRITO",
};

// Pill colour per access type.
export const ACCESS_TYPE_PILL_VARIANTS: Record<string, "success" | "warning" | "danger"> = {
  open: "success",
  open_with_account: "warning",
  restricted: "danger",
};

// Conditions available for each access audience (mirrors the backend
// AccessAudienceCondition enum). Shown only when the access type is restricted.
export const AUDIENCE_CONDITIONS = [
  { value: "yes", label: "Sim" },
  { value: "no", label: "Não" },
  { value: "under_condition", label: "Sujeito a condições" },
];

// Audience roles (mirrors the backend AccessAudienceType enum).
export const AUDIENCE_ROLES = [
  { role: "local_authority_and_administration", label: "Comunidade e Administração" },
  { role: "company_and_association", label: "Negócios e Associações" },
  { role: "private", label: "Especial" },
];

// Restriction reasons (mirrors the backend InspireLimitationCategory enum).
// "other" is a UI-only sentinel that reveals a free-text reason field.
export const RESTRICTION_REASONS = [
  {
    value: "confidentiality_of_proceedings_of_public_authorities",
    label: "Confidencialidade dos procedimentos das autoridades públicas",
  },
  {
    value: "international_relations_public_security_or_national_defence",
    label: "Relações internacionais, segurança pública ou defesa nacional",
  },
  { value: "course_of_justice_or_fair_trial", label: "Curso da justiça" },
  {
    value: "confidentiality_of_commercial_or_industrial_information",
    label: "Confidencialidade comercial ou industrial",
  },
  { value: "intellectual_property_rights", label: "Direitos de propriedade intelectual" },
  { value: "confidentiality_of_personal_data", label: "Confidencialidade dos dados pessoais" },
  {
    value: "protection_of_voluntary_information_suppliers",
    label: "Proteção dos fornecedores voluntários de informações",
  },
  { value: "protection_of_environment", label: "Proteção ambiental" },
  { value: "other", label: "Outro" },
];

// Lookup maps (value -> label) for rendering stored values on the detail page.
export const AUDIENCE_ROLE_LABELS: Record<string, string> = Object.fromEntries(
  AUDIENCE_ROLES.map((r) => [r.role, r.label])
);
export const AUDIENCE_CONDITION_LABELS: Record<string, string> = Object.fromEntries(
  AUDIENCE_CONDITIONS.map((c) => [c.value, c.label])
);
export const RESTRICTION_REASON_LABELS: Record<string, string> = Object.fromEntries(
  RESTRICTION_REASONS.map((r) => [r.value, r.label])
);
