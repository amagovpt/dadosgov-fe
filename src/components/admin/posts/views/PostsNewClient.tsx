"use client";

import React, { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createPost, publishPost, uploadPostImage } from "@/service/api/posts";
import AdminLayout from "@/components/Layout/AdminLayout";
import { AdminStepper } from "@/components/admin/AdminStepper";
import PostsNewContentStep from "@/components/admin/posts/form-steps/PostsNewContentStep";
import PostsNewMetadataStep from "@/components/admin/posts/form-steps/PostsNewMetadataStep";
import { POISONED_FILE_WARNING } from "@/lib/security/translateUploadError";
import { useFormErrors } from "@/hooks/forms/useFormErrors";
import { useKeywordSelect } from "@/hooks/forms/useKeywordSelect";
import {
  buildPostCreatePayload,
  type PostFormField,
  validatePostContent,
  validatePostMetadata,
} from "@/components/admin/posts/form-state/postFormModel";

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
  const [pendingAction, setPendingAction] = useState<"draft" | "publish" | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const isSaving = pendingAction !== null;
  const selectedKeywordsRef = useRef("");
  const { hasError, setErrors, clearError, resetErrors, focusFirstError } =
    useFormErrors<PostFormField>();
  const { setKeywordSearch, keywordOptions, registerSelectedKeywordValue } = useKeywordSelect({
    selectedKeywords: selectedTags,
  });

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
      registerSelectedKeywordValue(tag);
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
    const errors = validatePostMetadata({
      title: articleTitle,
      header: articleHeader,
      requireHeader: true,
    });

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    resetErrors();
    router.push("/admin/system/posts/new?step=2");
  }

  async function handleSave(publish: boolean) {
    const errors = validatePostContent(articleContent);
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      focusFirstError();
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    setPendingAction(publish ? "publish" : "draft");
    setSaveError(null);

    try {
      const payload = buildPostCreatePayload({
        title: articleTitle,
        header: articleHeader,
        content: articleContent,
        contentType,
        tags: selectedTags,
      });

      const result = await createPost(payload);
      if (result) {
        if (imageFile) {
          await uploadPostImage(result.id, imageFile);
        }
        if (publish) {
          await publishPost(result.id);
        }
        router.push("/admin/system/posts");
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
        { label: "Bem-vindo", url: "/admin" },
        { label: "Artigos", url: "/admin/system/posts" },
        { label: "Formulário de publicação de um artigo", url: "/admin/system/posts/new" },
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
            <PostsNewMetadataStep
              articleTitle={articleTitle}
              articleHeader={articleHeader}
              articleType={articleType}
              contentType={contentType}
              selectedTags={selectedTags}
              keywordOptions={keywordOptions}
              selectedKeywordsRef={selectedKeywordsRef}
              imageError={imageError}
              previewSrc={imageFile ? URL.createObjectURL(imageFile) : undefined}
              hasTitleError={hasError("articleTitle")}
              hasHeaderError={hasError("articleHeader")}
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
              onNext={handleStep1Next}
            />
          )}

          {currentStep === 2 && (
            <PostsNewContentStep
              articleContent={articleContent}
              hasContentError={hasError("articleContent")}
              saveError={saveError}
              isSaving={isSaving}
              pendingAction={pendingAction}
              onContentChange={(event) => {
                setArticleContent(event.target.value);
                if (event.target.value.trim()) {
                  clearError("articleContent");
                }
              }}
              onPrevious={() => router.push("/admin/system/posts/new?step=1")}
              onSaveDraft={() => {
                void handleSave(false);
              }}
              onPublish={() => {
                void handleSave(true);
              }}
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
