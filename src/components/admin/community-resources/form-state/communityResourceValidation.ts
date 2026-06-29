"use client";

export function buildValidationErrors<FieldName extends string>(
  validations: Partial<Record<FieldName, boolean>>,
) {
  const errors: Partial<Record<FieldName, boolean>> = {};

  for (const [field, hasError] of Object.entries(validations) as [FieldName, boolean][]) {
    if (hasError) {
      errors[field] = true;
    }
  }

  return errors;
}
