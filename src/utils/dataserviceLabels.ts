type Translate = (key: string) => string;

// Backend enum values and presentation helpers for data-service access metadata.
// Text belongs in the caller's i18n namespace, never in this shared utility.
export const ACCESS_TYPE_PILL_VARIANTS: Record<string, "success" | "warning" | "danger"> = {
  open: "success",
  open_with_account: "warning",
  restricted: "danger",
};

const AUDIENCE_CONDITION_VALUES = ["yes", "no", "under_condition"] as const;
const AUDIENCE_ROLE_VALUES = [
  "local_authority_and_administration",
  "company_and_association",
  "private",
] as const;
const RESTRICTION_REASON_VALUES = [
  "confidentiality_of_proceedings_of_public_authorities",
  "international_relations_public_security_or_national_defence",
  "course_of_justice_or_fair_trial",
  "confidentiality_of_commercial_or_industrial_information",
  "intellectual_property_rights",
  "confidentiality_of_personal_data",
  "protection_of_voluntary_information_suppliers",
  "protection_of_environment",
  "other",
] as const;

export function getAudienceConditions(t: Translate) {
  return AUDIENCE_CONDITION_VALUES.map((value) => ({
    value,
    label: t(`dataservices:access.audienceCondition.${value}`),
  }));
}

export function getAudienceRoles(t: Translate) {
  return AUDIENCE_ROLE_VALUES.map((role) => ({
    role,
    label: t(`dataservices:access.audienceRole.${role}`),
  }));
}

export function getRestrictionReasons(t: Translate) {
  return RESTRICTION_REASON_VALUES.map((value) => ({
    value,
    label: t(`dataservices:access.restrictionReason.${value}`),
  }));
}
