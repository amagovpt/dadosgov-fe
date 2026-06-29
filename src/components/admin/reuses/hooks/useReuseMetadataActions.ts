"use client";

import { updateReuse } from "@/service/api/reuses";
import type { Reuse } from "@/service/types/reuse";

interface UseReuseMetadataActionsParams {
  reuse: Reuse | null;
  title: string;
  url: string;
  description: string;
  selectedTypeRef: React.MutableRefObject<string>;
  selectedTopicRef: React.MutableRefObject<string>;
  selectedKeywordsRef: React.MutableRefObject<string>;
  setReuse: React.Dispatch<React.SetStateAction<Reuse | null>>;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  setApiError: React.Dispatch<React.SetStateAction<string | null>>;
  setApiSuccess: React.Dispatch<React.SetStateAction<string | null>>;
  setErrors: (errors: Record<string, boolean>) => void;
  resetErrors: () => void;
  focusFirstError: () => void;
  showApiSuccess: (message: string, durationMs?: number) => void;
}

export function useReuseMetadataActions({
  reuse,
  title,
  url,
  description,
  selectedTypeRef,
  selectedTopicRef,
  selectedKeywordsRef,
  setReuse,
  setIsSubmitting,
  setApiError,
  setApiSuccess,
  setErrors,
  resetErrors,
  focusFirstError,
  showApiSuccess,
}: UseReuseMetadataActionsParams) {
  async function handleSaveMetadata() {
    if (!reuse) return;

    const errors: Record<string, boolean> = {};
    if (!title.trim()) errors.title = true;
    if (!url.trim()) errors.url = true;
    if (!description.trim()) errors.description = true;

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      focusFirstError();
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    resetErrors();
    setApiError(null);
    setApiSuccess(null);
    setIsSubmitting(true);

    try {
      const tagsValue = selectedKeywordsRef.current
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const updated = await updateReuse(reuse.id, {
        title: title.trim(),
        url: url.trim(),
        description: description.trim(),
        type: selectedTypeRef.current || undefined,
        topic: selectedTopicRef.current || undefined,
        tags: tagsValue,
      });

      setReuse(updated);
      showApiSuccess("Reutilização atualizada com sucesso.");
    } catch (error: unknown) {
      const err = error as { data?: Record<string, unknown> };
      if (err.data && typeof err.data === "object") {
        const messages = Object.entries(err.data)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ");
        setApiError(messages);
      } else {
        setApiError("Erro ao atualizar a reutilização.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    handleSaveMetadata,
  };
}
