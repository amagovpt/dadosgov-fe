"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@ama-pt/agora-design-system";
import { createPost, publishPost, uploadPostImage } from "@/service/api/posts";
import AdminLayout from "@/components/Layout/AdminLayout";
import { AdminStepper } from "@/components/admin/AdminStepper";
import type { PostCreatePayload } from "@/service/types/posts";
import { POISONED_FILE_WARNING } from "@/lib/security/translateUploadError";
import { usePostKeywords } from "@/components/admin/posts/usePostKeywords";
import PostMetadataSection from "@/components/admin/posts/PostMetadataSection";
import PostContentSection from "@/components/admin/posts/PostContentSection";

export default function PostsNewClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const totalSteps = 2;
  const currentStep = Number(searchParams.get("step")) || 1;
  const [articleType, setArticleType] = useState("news");
  const [contentType, setContentType] = useState("markdown");
  const [articleTitle, setArticleTitle] = useState("");
  const [articleHeader, setArticleHeader] = useState("");
  const [articleContent, setArticleContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const [pendingAction, setPendingAction] = useState<"draft" | "publish" | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const isSaving = pendingAction !== null;

  const { setKeywordSearch, keywordOptions, selectedKeywordsRef, addCustomTag } =
    usePostKeywords(selectedTags);

  function clearError(field: string) {
    if (formErrors[field]) {
      setFormErrors((previousErrors) => {
        const nextErrors = { ...previousErrors };
        delete nextErrors[field];
        return nextErrors;
      });
    }
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (file && file.size > 4194304) {
      setImageError("O ficheiro excede o tamanho máximo de 4 MB.");
      setImageFile(null);
      return;
    }
    setImageError(null);
    setImageFile(file);
  }

  function handleKeywordsChange(value: string) {
    const selected = value.split(",").filter(Boolean);
    setSelectedTags(selected);

    let addedNew = false;
    selected.forEach((tag) => {
      addedNew = true;
      addCustomTag(tag);
    });

    if (addedNew) {
      setKeywordSearch("");
    }
  }

  function handleRemoveTag(keyword: string) {
    const next = selectedTags.filter((value) => value.toLowerCase() !== keyword.toLowerCase());
    setSelectedTags(next);
    selectedKeywordsRef.current = next.join(",");
  }

  function handleStep1Next() {
    const errors: Record<string, boolean> = {};
    if (!articleTitle.trim()) errors.articleTitle = true;
    if (!articleHeader.trim()) errors.articleHeader = true;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    router.push("/pages/admin/system/posts/new?step=2");
  }

  async function handleSave(publish: boolean) {
    if (!articleContent.trim()) {
      setFormErrors({ articleContent: true });
      requestAnimationFrame(() => {
        document
          .querySelector('[aria-invalid="true"]')
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    setPendingAction(publish ? "publish" : "draft");
    setSaveError(null);

    try {
      const payload: PostCreatePayload = {
        name: articleTitle.trim(),
        headline: articleHeader.trim(),
        content: articleContent.trim(),
        body_type: contentType,
        tags: selectedTags,
      };

      const result = await createPost(payload);
      if (result) {
        if (imageFile) {
          await uploadPostImage(result.id, imageFile);
        }
        if (publish) {
          await publishPost(result.id);
        }
        router.push("/pages/admin/system/posts");
      } else {
        setSaveError("Erro ao guardar o artigo. Verifique a autenticação.");
      }
    } catch {
      setSaveError("Erro ao guardar o artigo.");
    } finally {
      setPendingAction(null);
    }
  }

  const stepTitles: Record<number, string> = {
    1: "Crie o seu artigo",
    2: "Conteúdo",
  };

  return (
    <AdminLayout
      breadcrumbItems={[
        { label: "Bem-vindo", url: "/pages/admin" },
        { label: "Artigos", url: "/pages/admin/system/posts" },
        { label: "Formulário de publicação de um artigo", url: "/pages/admin/system/posts/new" },
      ]}
      title="Formulário de publicação de um artigo"
    >
      <AdminStepper
        currentStep={currentStep}
        totalSteps={totalSteps}
        stepTitle={stepTitles[currentStep]}
      />

      <div className="admin-page__body">
        <div className="admin-page__form-area">
          {currentStep === 1 && (
            <form className="admin-page__form" onSubmit={(event) => event.preventDefault()}>
              <p className="pt-32 text-base leading-7 text-neutral-900">
                Os campos marcados com um asterisco ( * ) são obrigatórios.
              </p>

              <PostMetadataSection
                title={articleTitle}
                header={articleHeader}
                articleType={articleType}
                contentType={contentType}
                selectedTags={selectedTags}
                keywordOptions={keywordOptions}
                selectedKeywordsRef={selectedKeywordsRef}
                imageError={imageError}
                previewSrc={imageFile ? URL.createObjectURL(imageFile) : undefined}
                hasTitleError={!!formErrors.articleTitle}
                hasHeaderError={!!formErrors.articleHeader}
                onTitleChange={(event) => {
                  setArticleTitle(event.target.value);
                  if (event.target.value.trim()) {
                    clearError("articleTitle");
                  }
                }}
                onHeaderChange={(event) => {
                  setArticleHeader(event.target.value);
                  if (event.target.value.trim()) {
                    clearError("articleHeader");
                  }
                }}
                onArticleTypeChange={setArticleType}
                onContentTypeChange={setContentType}
                onKeywordSearchChange={setKeywordSearch}
                onKeywordsChange={handleKeywordsChange}
                onRemoveTag={handleRemoveTag}
                onImageChange={handleImageChange}
                onImageSecurityError={() => setImageError(POISONED_FILE_WARNING)}
              />

              <div className="admin-page__actions">
                <Button
                  variant="primary"
                  hasIcon
                  trailingIcon="agora-line-arrow-right-circle"
                  trailingIconHover="agora-solid-arrow-right-circle"
                  onClick={handleStep1Next}
                >
                  Seguinte
                </Button>
              </div>
            </form>
          )}

          {currentStep === 2 && (
            <form className="admin-page__form" onSubmit={(event) => event.preventDefault()}>
              <PostContentSection
                content={articleContent}
                hasError={!!formErrors.articleContent}
                onChange={(event) => {
                  setArticleContent(event.target.value);
                  if (event.target.value.trim()) {
                    clearError("articleContent");
                  }
                }}
              />

              {saveError && <p className="mb-16 text-sm text-danger-600">{saveError}</p>}

              <div className="admin-page__actions">
                <Button
                  appearance="outline"
                  variant="primary"
                  hasIcon
                  leadingIcon="agora-line-arrow-left-circle"
                  leadingIconHover="agora-solid-arrow-left-circle"
                  onClick={() => router.push("/pages/admin/system/posts/new?step=1")}
                >
                  Anterior
                </Button>
                <Button
                  appearance="outline"
                  variant="primary"
                  hasIcon
                  trailingIcon="agora-line-check-circle"
                  trailingIconHover="agora-solid-check-circle"
                  onClick={() => {
                    void handleSave(false);
                  }}
                  disabled={isSaving}
                >
                  {pendingAction === "draft" ? "A guardar..." : "Guardar como rascunho"}
                </Button>
                <Button
                  variant="primary"
                  hasIcon
                  trailingIcon="agora-line-check-circle"
                  trailingIconHover="agora-solid-check-circle"
                  onClick={() => {
                    void handleSave(true);
                  }}
                  disabled={isSaving}
                >
                  {pendingAction === "publish" ? "A publicar..." : "Publicar artigo"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
