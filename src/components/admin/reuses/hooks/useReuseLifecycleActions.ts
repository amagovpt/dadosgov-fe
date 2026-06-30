"use client";

import type React from "react";
import { usePopupContext } from "@ama-pt/agora-design-system";
import { deleteReuse, fetchReuse, updateReuse } from "@/service/api/reuses";
import type { Reuse } from "@/service/types/reuse";

interface UseReuseLifecycleActionsParams {
  reuse: Reuse | null;
  hide: () => void;
  push: (href: string) => void;
  setReuse: React.Dispatch<React.SetStateAction<Reuse | null>>;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  setApiError: React.Dispatch<React.SetStateAction<string | null>>;
  setApiSuccess: React.Dispatch<React.SetStateAction<string | null>>;
  showApiSuccess: (message: string, durationMs?: number) => void;
}

export function useReuseLifecycleActions({
  reuse,
  hide,
  push,
  setReuse,
  setIsSubmitting,
  setApiError,
  setApiSuccess,
  showApiSuccess,
}: UseReuseLifecycleActionsParams) {
  async function handlePublishReuse() {
    if (!reuse) return;

    setApiError(null);
    setApiSuccess(null);
    setIsSubmitting(true);
    try {
      const updated = await updateReuse(reuse.id, {
        private: false,
      });
      setReuse(updated);
      showApiSuccess("Reutilização publicada com sucesso.");
    } catch {
      setApiError("Erro ao publicar a reutilização.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteReuse() {
    if (!reuse) return;

    hide();
    setIsSubmitting(true);
    try {
      await deleteReuse(reuse.id);
      push("/admin/me/reuses");
    } catch (error) {
      console.error("Error deleting reuse:", error);
      setApiError("Erro ao eliminar a reutilização.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenDeletePopup(
    renderPopup: (onConfirm: () => Promise<void>) => React.ReactNode,
    show: ReturnType<typeof usePopupContext>["show"],
  ) {
    if (!reuse) return;

    show(renderPopup(handleDeleteReuse), {
      title: "Elimine a reutilização",
      closeAriaLabel: "Fechar",
      dimensions: "m",
    });
  }

  async function handleArchiveReuse() {
    if (!reuse) return;

    setApiError(null);
    setApiSuccess(null);
    setIsSubmitting(true);
    try {
      const updated = await updateReuse(reuse.id, {
        archived: new Date().toISOString(),
      });
      setReuse(updated);
      showApiSuccess("Reutilização arquivada com sucesso.");
    } catch (error) {
      console.error("Error archiving reuse:", error);
      setApiError("Erro ao arquivar a reutilização.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUnarchiveReuse() {
    if (!reuse) return;

    setApiError(null);
    setApiSuccess(null);
    setIsSubmitting(true);
    try {
      const updated = await updateReuse(reuse.id, { archived: null });
      setReuse(updated);
      showApiSuccess("Reutilização desarquivada com sucesso.");
    } catch (error) {
      console.error("Error unarchiving reuse:", error);
      setApiError("Erro ao desarquivar a reutilização.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !reuse) return;

    const file = files[0];
    if (file.size > 4194304) {
      setApiError(null);
      throw new Error("MAX_FILE_SIZE");
    }

    setIsSubmitting(true);
    try {
      const { uploadReuseImage } = await import("@/service/api/reuses");
      await uploadReuseImage(reuse.id, file);
      const updated = await fetchReuse(reuse.id);
      setReuse(updated);
      showApiSuccess("Imagem de capa atualizada com sucesso.");
    } catch (error) {
      if (error instanceof Error && error.message === "MAX_FILE_SIZE") {
        throw error;
      }
      setApiError("Erro ao carregar imagem de capa.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    handleArchiveReuse,
    handleDeleteReuse,
    handleImageUpload,
    handleOpenDeletePopup,
    handlePublishReuse,
    handleUnarchiveReuse,
  };
}
