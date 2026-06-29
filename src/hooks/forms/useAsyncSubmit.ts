"use client";

import { useCallback, useState } from "react";

interface UseAsyncSubmitOptions<TError = unknown> {
  clearError?: () => void;
  clearSuccess?: () => void;
  onSuccess?: () => void;
  onError?: (error: TError) => void;
  scrollToTopOnStart?: boolean;
  scrollToTopOnError?: boolean;
  scrollToTopOnSuccess?: boolean;
}

export function useAsyncSubmit<TError = unknown>(
  options: UseAsyncSubmitOptions<TError> = {},
) {
  const {
    clearError,
    clearSuccess,
    onSuccess,
    onError,
    scrollToTopOnStart = false,
    scrollToTopOnError = false,
    scrollToTopOnSuccess = false,
  } = options;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const run = useCallback(
    async <TResult,>(task: () => Promise<TResult>): Promise<TResult> => {
      clearError?.();
      clearSuccess?.();

      if (scrollToTopOnStart) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      setIsSubmitting(true);

      try {
        const result = await task();

        if (scrollToTopOnSuccess) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }

        onSuccess?.();
        return result;
      } catch (error) {
        if (scrollToTopOnError) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }

        onError?.(error as TError);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      clearError,
      clearSuccess,
      onError,
      onSuccess,
      scrollToTopOnError,
      scrollToTopOnStart,
      scrollToTopOnSuccess,
    ],
  );

  return {
    isSubmitting,
    run,
    setIsSubmitting,
  };
}
