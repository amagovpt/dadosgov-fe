"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Breadcrumb,
  Button,
  DropdownSection,
  DropdownOption,
  InputText,
  InputTextArea,
  RadioButton,
  Tag,
} from "@ama-pt/agora-design-system";
import DragAndDropUploader from "@/components/Primitives/DragAndDropUploader/DragAndDropUploader";
import { createPost, uploadPostImage, publishPost } from "@/app/api/posts";
import { suggestTags } from "@/app/api/search";
import type { TagSuggestion } from "@/service/types/api";
import PublishDropdown from "@/components/admin/PublishDropdown";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import type { PostCreatePayload } from "@/service/types/api";
import { POISONED_FILE_WARNING } from "@/lib/security/translateUploadError";

export default function PostsNewClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const totalSteps = 2;
  const currentStep = Number(searchParams.get("step")) || 1;
  const totalSegments = 12;
  const filledSegments = Math.round((currentStep / totalSteps) * totalSegments);

  const [articleType, setArticleType] = useState("news");
  const [contentType, setContentType] = useState("markdown");
  const [articleTitle, setArticleTitle] = useState("");
  const [articleHeader, setArticleHeader] = useState("");
  const [articleContent, setArticleContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const selectedKeywordsRef = useRef("");
  const [keywordSearch, setKeywordSearch] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const [tags, setTags] = useState<TagSuggestion[]>([]);
  const [tagSearch, setTagSearch] = useState<TagSuggestion[]>([]);
  const [pendingAction, setPendingAction] = useState<"draft" | "publish" | null>(null);
  const isSaving = pendingAction !== null;
  const [saveError, setSaveError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    suggestTags("", 50).then(setTags);
  }, []);

  useEffect(() => {
    const q = keywordSearch.trim();
    if (q.length < 2) return;

    const timer = setTimeout(async () => {
      try {
        const res = await suggestTags(q, 20);
        setTagSearch(res);
      } catch {
        setTagSearch([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [keywordSearch]);

  const keywordOptions = useMemo(() => {
    const trimmed = keywordSearch.trim();
    const trimmedLower = trimmed.toLowerCase();
    // Selected tags stay visible regardless of query so the InputSelect keeps
    // tracking them across searches; otherwise typing a new query would drop
    // them from the children and the next onChange would lose those selections.
    const selectedLowerSet = new Set(selectedTags.map((k) => k.toLowerCase()));
    const seen = new Set<string>();
    const visibleTagSearch = trimmed.length < 2 ? [] : tagSearch;
    const uniqueTags = [...tags, ...visibleTagSearch].filter((t) => {
      const key = t.text.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      if (selectedLowerSet.has(key)) return true;
      if (trimmedLower && !key.includes(trimmedLower)) return false;
      return true;
    });
    const selectedNotInSuggestions = selectedTags.filter(
      (keyword) => !seen.has(keyword.toLowerCase()),
    );
    const showCreate =
      trimmed.length > 0 &&
      ![...tags, ...tagSearch].some((t) => t.text.toLowerCase() === trimmedLower) &&
      !selectedLowerSet.has(trimmedLower);
    const options = [
      ...(showCreate
        ? [
            <DropdownOption key={`__create__${trimmedLower}`} value={trimmed} selected={false}>
              Criar &quot;{trimmed}&quot;
            </DropdownOption>,
          ]
        : []),
      ...selectedNotInSuggestions.map((keyword) => (
        <DropdownOption key={`selected-${keyword.toLowerCase()}`} value={keyword} selected>
          {keyword}
        </DropdownOption>
      )),
      ...uniqueTags.map((tag) => (
        <DropdownOption
          key={tag.text.toLowerCase()}
          value={tag.text}
          selected={selectedLowerSet.has(tag.text.toLowerCase())}
        >
          {tag.text}
        </DropdownOption>
      )),
    ];
    return <DropdownSection name="keywords">{options}</DropdownSection>;
  }, [tags, tagSearch, selectedTags, keywordSearch]);

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
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Bem-vindo", url: "/pages/admin" },
            { label: "Artigos", url: "/pages/admin/system/posts" },
            {
              label: "Formulário de publicação de um artigo",
              url: "/pages/admin/system/posts/new",
            },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">Formulário de publicação de um artigo</h1>
        <PublishDropdown />
      </div>

      {/* Step indicator */}
      <div className="admin-page__step-header">
        <p className="admin-page__step-text">
          <span className="text-primary-600 font-bold">Passo {currentStep} - </span>
          <span className="text-primary-900 font-bold">{stepTitles[currentStep]}</span>
        </p>
      </div>

      {/* Progress bar */}
      <div className="admin-page__stepper">
        <div className="admin-page__stepper-bar">
          <div className="admin-page__stepper-mark admin-page__stepper-mark--start" />
          {Array.from({ length: totalSegments }).map((_, i) => (
            <div
              key={i}
              className={`admin-page__stepper-segment ${
                i < filledSegments ? "admin-page__stepper-segment--filled" : ""
              }`}
            />
          ))}
          <div className="admin-page__stepper-mark admin-page__stepper-mark--end" />
        </div>
        <span className="admin-page__stepper-label">
          Passo {currentStep}/{totalSteps}
        </span>
      </div>

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
                      const lower = v.toLowerCase();
                      const existsInTags = tags.some((t) => t.text.toLowerCase() === lower);
                      const existsInSearch = tagSearch.some((t) => t.text.toLowerCase() === lower);
                      if (!existsInTags && !existsInSearch) {
                        addedNew = true;
                        setTags((prev) => {
                          if (prev.some((t) => t.text.toLowerCase() === lower)) {
                            return prev;
                          }
                          return [...prev, { text: v }];
                        });
                      }
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

                <div>
                  <span className="text-primary-900 text-base font-medium leading-7">
                    Imagem de capa
                  </span>
                  <div className="mt-2 [&_.instructions]:items-center [&_.instructions]:text-center [&_.drag-and-drop-area_.agora-btn]:w-fit">
                    <DragAndDropUploader
                      label="Ficheiros"
                      dragAndDropLabel="Arraste e largue o ficheiro aqui"
                      inputLabel="Selecione ou arraste o ficheiro"
                      selectedFilesLabel="ficheiro selecionado"
                      removeFileButtonLabel="Remover ficheiro"
                      replaceFileButtonLabel="Substituir ficheiro"
                      extensionsInstructions="Tamanho máximo: 4 MB. Formatos aceites: JPG, JPEG, PNG."
                      accept=".jpg,.jpeg,.png"
                      maxSize={4194304}
                      maxCount={1}
                      maxSizeExceededErrorLabel="O ficheiro excede o tamanho máximo de 4 MB."
                      forbiddenExtensionErrorLabel="Formato de ficheiro não permitido."
                      hasError={!!imageError}
                      hasFeedback={!!imageError}
                      feedbackState="danger"
                      feedbackText={imageError ?? undefined}
                      onChange={handleImageChange}
                      onSecurityError={() => setImageError(POISONED_FILE_WARNING)}
                    />
                  </div>
                </div>
                {imageFile && (
                  <div className="mt-4 flex justify-center">
                    <img
                      src={imageFile ? URL.createObjectURL(imageFile) : undefined}
                      alt="Cobertura do artigo"
                      className="max-w-[200px] max-h-[150px] object-contain border border-neutral-200 rounded"
                    />
                  </div>
                )}
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
    </div>
  );
}
