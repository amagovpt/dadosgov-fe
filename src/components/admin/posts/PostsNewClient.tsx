"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Button,
  InputText,
  InputTextArea,
  RadioButton,
  Tag,
} from "@ama-pt/agora-design-system";
import { createPost, uploadPostImage, publishPost } from "@/service/api/posts";
import AdminLayout from "@/components/Layout/AdminLayout";
import { AdminStepper } from "@/components/admin/AdminStepper";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import type { PostCreatePayload } from "@/service/types/posts";
import { POISONED_FILE_WARNING } from "@/lib/security/translateUploadError";
import { usePostKeywords } from "@/components/admin/posts/usePostKeywords";
import { ImageUploadField } from "@/components/admin/posts/ImageUploadField";

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
  const isSaving = pendingAction !== null;
  const [saveError, setSaveError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const { keywordSearch, setKeywordSearch, keywordOptions, selectedKeywordsRef, addCustomTag } =
    usePostKeywords(selectedTags);

  const clearError = (field: string) => {
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > 4194304) {
      setImageError("O ficheiro excede o tamanho máximo de 4 MB.");
      setImageFile(null);
      return;
    }
    setImageError(null);
    setImageFile(file);
  };

  const handleStep1Next = () => {
    const errors: Record<string, boolean> = {};
    if (!articleTitle.trim()) errors.articleTitle = true;
    if (!articleHeader.trim()) errors.articleHeader = true;
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    router.push("/pages/admin/system/posts/new?step=2");
  };

  const handleSave = async (publish: boolean) => {
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
  };

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

      {/* Main content area: form + auxiliar sidebar */}
      <div className="admin-page__body">
        {/* Left: Form */}
        <div className="admin-page__form-area">
          {/* Step 1: Descrição */}
          {currentStep === 1 && (
            <form className="admin-page__form" onSubmit={(e) => e.preventDefault()}>
              <p className="text-neutral-900 text-base leading-7 pt-32">
                Os campos marcados com um asterisco ( * ) são obrigatórios.
              </p>

              <h2 className="admin-page__section-title">Descrição</h2>

              <div className="admin-page__fields-group">
                <InputText
                  label="Título do artigo *"
                  placeholder="Insira o título aqui"
                  id="article-title"
                  value={articleTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setArticleTitle(e.target.value);
                    if (e.target.value.trim()) clearError("articleTitle");
                  }}
                  hasError={!!formErrors.articleTitle}
                  hasFeedback={!!formErrors.articleTitle}
                  feedbackState="danger"
                  errorFeedbackText="Campo obrigatório"
                />

                <InputTextArea
                  label="Cabeçalho *"
                  placeholder="Insira o cabeçalho aqui"
                  id="article-header"
                  rows={3}
                  value={articleHeader}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    setArticleHeader(e.target.value);
                    if (e.target.value.trim()) clearError("articleHeader");
                  }}
                  hasError={!!formErrors.articleHeader}
                  hasFeedback={!!formErrors.articleHeader}
                  feedbackState="danger"
                  errorFeedbackText="Campo obrigatório"
                />

                <div className="flex flex-col gap-8">
                  <span className="text-primary-900 text-base font-medium leading-7">
                    Tipo de artigo
                  </span>
                  <div className="flex flex-row gap-4">
                    <RadioButton
                      label="Notícias"
                      id="article-type-news"
                      name="article-type"
                      checked={articleType === "news"}
                      onChange={() => setArticleType("news")}
                    />
                    <RadioButton
                      label="Página"
                      id="article-type-page"
                      name="article-type"
                      checked={articleType === "page"}
                      onChange={() => setArticleType("page")}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-8">
                  <span className="text-primary-900 text-base font-medium leading-7">
                    Tipo de conteúdo
                  </span>
                  <div className="flex flex-row gap-4">
                    <RadioButton
                      label="HTML"
                      id="content-html"
                      name="content-type"
                      checked={contentType === "html"}
                      onChange={() => setContentType("html")}
                    />
                    <RadioButton
                      label="Markdown"
                      id="content-markdown"
                      name="content-type"
                      checked={contentType === "markdown"}
                      onChange={() => setContentType("markdown")}
                    />
                  </div>
                </div>

                <IsolatedSelect
                  label="Palavras-chave"
                  placeholder="Pesquise ou insira palavras-chave..."
                  id="article-keywords"
                  type="checkbox"
                  hideSectionNames={true}
                  searchable={true}
                  searchInputPlaceholder="Escreva para pesquisar ou criar..."
                  searchNoResultsText="Nenhum resultado encontrado"
                  defaultValue={selectedTags.join(",")}
                  onChangeRef={selectedKeywordsRef}
                  onSearchCallback={setKeywordSearch}
                  onChangeCallback={(value) => {
                    const selected = value.split(",").filter(Boolean);
                    setSelectedTags(selected);
                    let addedNew = false;
                    selected.forEach((v) => {
                      addedNew = true;
                      addCustomTag(v);
                    });
                    if (addedNew) {
                      setKeywordSearch("");
                    }
                  }}
                >
                  {keywordOptions}
                </IsolatedSelect>

                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-8 -mt-8">
                    {selectedTags.map((keyword) => (
                      <Tag
                        key={keyword}
                        aria-label={`Remover ${keyword}`}
                        onClick={() => {
                          const next = selectedTags.filter(
                            (v) => v.toLowerCase() !== keyword.toLowerCase()
                          );
                          setSelectedTags(next);
                          selectedKeywordsRef.current = next.join(",");
                        }}
                      >
                        {keyword}
                      </Tag>
                    ))}
                  </div>
                )}

                <ImageUploadField
                  onChange={handleImageChange}
                  onSecurityError={() => setImageError(POISONED_FILE_WARNING)}
                  error={imageError}
                  previewSrc={imageFile ? URL.createObjectURL(imageFile) : undefined}
                />
              </div>

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

          {/* Step 2: Conteúdo */}
          {currentStep === 2 && (
            <form className="admin-page__form" onSubmit={(e) => e.preventDefault()}>
              <div className="admin-page__fields-group">
                <InputTextArea
                  label="Conteúdo *"
                  placeholder="Insira aqui"
                  id="article-content"
                  rows={12}
                  value={articleContent}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    setArticleContent(e.target.value);
                    if (e.target.value.trim()) clearError("articleContent");
                  }}
                  hasError={!!formErrors.articleContent}
                  hasFeedback={!!formErrors.articleContent}
                  feedbackState="danger"
                  errorFeedbackText="Campo obrigatório"
                />
              </div>

              {saveError && <p className="text-danger-600 text-sm mb-16">{saveError}</p>}

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
                  onClick={() => handleSave(false)}
                  disabled={isSaving}
                >
                  {pendingAction === "draft" ? "A guardar..." : "Guardar como rascunho"}
                </Button>
                <Button
                  variant="primary"
                  hasIcon
                  trailingIcon="agora-line-check-circle"
                  trailingIconHover="agora-solid-check-circle"
                  onClick={() => handleSave(true)}
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
