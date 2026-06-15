"use client";

import { useCallback, useMemo, useState } from "react";

export type FormErrors<TField extends string = string> = Partial<Record<TField, boolean>>;

interface ScrollToFirstErrorOptions {
  selector?: string;
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
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

  const setError = useCallback((field: TField, value: boolean = true) => {
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

  const scrollToFirstError = useCallback((options: ScrollToFirstErrorOptions = {}) => {
    const {
      selector = '[aria-invalid="true"]',
      behavior = "smooth",
      block = "center",
    } = options;

    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(selector)?.scrollIntoView({ behavior, block });
    });
  }, []);

  const hasAnyError = useMemo(() => Object.keys(errors).length > 0, [errors]);

  return {
    errors,
    hasAnyError,
    hasError,
    setErrors,
    setError,
    clearError,
    resetErrors,
    scrollToFirstError,
  };
}
