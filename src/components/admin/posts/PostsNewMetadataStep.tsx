"use client";

import React from "react";
import type { JSX } from "react";
import AdminStepActions from "@/components/admin/forms/AdminStepActions";
import PostMetadataSection from "@/components/admin/posts/PostMetadataSection";

interface PostsNewMetadataStepProps {
  articleTitle: string;
  articleHeader: string;
  articleType: string;
  contentType: string;
  selectedTags: string[];
  keywordOptions: JSX.Element;
  selectedKeywordsRef: React.RefObject<string>;
  imageError: string | null;
  previewSrc?: string;
  hasTitleError: boolean;
  hasHeaderError: boolean;
  onTitleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onHeaderChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onArticleTypeChange: (value: string) => void;
  onContentTypeChange: (value: string) => void;
  onKeywordSearchChange: (value: string) => void;
  onKeywordsChange: (value: string) => void;
  onRemoveTag: (tag: string) => void;
  onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImageSecurityError: () => void;
  onNext: () => void;
}

export default function PostsNewMetadataStep({
  articleTitle,
  articleHeader,
  articleType,
  contentType,
  selectedTags,
  keywordOptions,
  selectedKeywordsRef,
  imageError,
  previewSrc,
  hasTitleError,
  hasHeaderError,
  onTitleChange,
  onHeaderChange,
  onArticleTypeChange,
  onContentTypeChange,
  onKeywordSearchChange,
  onKeywordsChange,
  onRemoveTag,
  onImageChange,
  onImageSecurityError,
  onNext,
}: PostsNewMetadataStepProps) {
  return (
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
        previewSrc={previewSrc}
        hasTitleError={hasTitleError}
        hasHeaderError={hasHeaderError}
        onTitleChange={onTitleChange}
        onHeaderChange={onHeaderChange}
        onArticleTypeChange={onArticleTypeChange}
        onContentTypeChange={onContentTypeChange}
        onKeywordSearchChange={onKeywordSearchChange}
        onKeywordsChange={onKeywordsChange}
        onRemoveTag={onRemoveTag}
        onImageChange={onImageChange}
        onImageSecurityError={onImageSecurityError}
      />

      <AdminStepActions
        primaryAction={{
          label: "Seguinte",
          onClick: onNext,
          hasIcon: true,
          trailingIcon: "agora-line-arrow-right-circle",
          trailingIconHover: "agora-solid-arrow-right-circle",
        }}
      />
    </form>
  );
}
