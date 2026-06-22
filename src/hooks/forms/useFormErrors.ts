"use client";

import { useCallback, useMemo, useState } from "react";

export type FormErrorValue = boolean | string;
export type FormErrors<TField extends string = string> = Partial<Record<TField, FormErrorValue>>;

interface FirstErrorOptions {
  selector?: string;
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
}

const FOCUSABLE_SELECTOR =
  'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function revealFirstFormError({
  selector = '[aria-invalid="true"]',
  behavior = "smooth",
  block = "center",
}: FirstErrorOptions = {}): HTMLElement | null {
  const invalidElement = document.querySelector<HTMLElement>(selector);
  if (!invalidElement) return null;

  const focusTarget = invalidElement.matches(FOCUSABLE_SELECTOR)
    ? invalidElement
    : invalidElement.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);

  focusTarget?.focus({ preventScroll: true });
  invalidElement.scrollIntoView?.({ behavior, block });

  return focusTarget ?? invalidElement;
}

export function useFormErrors<TField extends string = string>(
  initialErrors: FormErrors<TField> = {},
) {
  const [errors, setErrors] = useState<FormErrors<TField>>(initialErrors);

  const clearError = useCallback((field: TField) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const setError = useCallback((field: TField, value: FormErrorValue = true) => {
    setErrors((prev) => {
      if (prev[field] === value) return prev;
      return { ...prev, [field]: value };
    });
  }, []);

  const resetErrors = useCallback(() => {
    setErrors({});
  }, []);

  const hasError = useCallback(
    (field: TField) => Boolean(errors[field]),
    [errors],
  );

  const getErrorMessage = useCallback(
    (field: TField, fallbackMessage: string = "Campo obrigatório") => {
      const error = errors[field];
      return typeof error === "string" ? error : error ? fallbackMessage : undefined;
    },
    [errors],
  );

  const focusFirstError = useCallback((options: FirstErrorOptions = {}) => {
    requestAnimationFrame(() => {
      revealFirstFormError(options);
    });
  }, []);

  const scrollToFirstError = focusFirstError;

  const hasAnyError = useMemo(() => Object.values(errors).some(Boolean), [errors]);

  return {
    errors,
    hasAnyError,
    hasError,
    getErrorMessage,
    setErrors,
    setError,
    clearError,
    resetErrors,
    focusFirstError,
    scrollToFirstError,
  };
}
