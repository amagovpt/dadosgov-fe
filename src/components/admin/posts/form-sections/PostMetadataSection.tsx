"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { InputText, InputTextArea, RadioButton } from "@ama-pt/agora-design-system";
import ImageUploadField from "@/components/admin/forms/ImageUploadField";
import KeywordSelectField from "@/components/admin/forms/KeywordSelectField";

interface PostMetadataSectionProps {
  title: string;
  header: string;
  articleType: string;
  contentType: string;
  selectedTags: string[];
  keywordOptions: React.JSX.Element;
  selectedKeywordsRef: React.RefObject<string>;
  imageError: string | null;
  previewSrc?: string;
  hasTitleError?: boolean;
  hasHeaderError?: boolean;
  contentTypeOptions?: string[];
  sectionTitle?: string;
  sectionTitleClassName?: string;
  headerPlaceholder?: string;
  articleTypeLabel?: string;
  pageLabel?: string;
  contentTypeLabel?: string;
  onTitleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onHeaderChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onArticleTypeChange: (value: string) => void;
  onContentTypeChange: (value: string) => void;
  onKeywordSearchChange: (value: string) => void;
  onKeywordsChange: (value: string) => void;
  onRemoveTag: (tag: string) => void;
  onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImageSecurityError: () => void;
}

export default function PostMetadataSection({
  title,
  header,
  articleType,
  contentType,
  selectedTags,
  keywordOptions,
  selectedKeywordsRef,
  imageError,
  previewSrc,
  hasTitleError = false,
  hasHeaderError = false,
  contentTypeOptions = ["html", "markdown"],
  sectionTitle,
  sectionTitleClassName = "admin-page__section-title",
  headerPlaceholder,
  articleTypeLabel,
  pageLabel,
  contentTypeLabel,
  onTitleChange,
  onHeaderChange,
  onArticleTypeChange,
  onContentTypeChange,
  onKeywordSearchChange,
  onKeywordsChange,
  onRemoveTag,
  onImageChange,
  onImageSecurityError,
}: PostMetadataSectionProps) {
  const { t } = useTranslation(["admin-common", "admin-posts"]);

  return (
    <>
      <h2 className={sectionTitleClassName}>
        {sectionTitle || t("admin-posts:metadataForm.sectionTitle")}
      </h2>

      <div className="admin-page__fields-group">
        <InputText
          label={t("admin-posts:metadataForm.articleTitle")}
          placeholder={t("admin-posts:metadataForm.articleTitlePlaceholder")}
          id="article-title"
          value={title}
          onChange={onTitleChange}
          hasError={hasTitleError}
          hasFeedback={hasTitleError}
          feedbackState="danger"
          errorFeedbackText={t("admin-common:forms.requiredField")}
        />

        <InputTextArea
          label={t("admin-posts:metadataForm.header")}
          placeholder={headerPlaceholder || t("admin-posts:metadataForm.headerPlaceholder")}
          id="article-header"
          rows={3}
          value={header}
          onChange={onHeaderChange}
          hasError={hasHeaderError}
          hasFeedback={hasHeaderError}
          feedbackState="danger"
          errorFeedbackText={t("admin-common:forms.requiredField")}
        />

        <div className="flex flex-col gap-8">
          <span className="text-primary-900 text-base font-medium leading-7">
            {articleTypeLabel || t("admin-posts:metadataForm.articleType")}
          </span>
          <div className="flex flex-row gap-4">
            <RadioButton
              label={t("admin-posts:list.news")}
              id="article-type-news"
              name="article-type"
              checked={articleType === "news"}
              onChange={() => onArticleTypeChange("news")}
            />
            <RadioButton
              label={pageLabel || t("admin-posts:list.page")}
              id="article-type-page"
              name="article-type"
              checked={articleType === "page"}
              onChange={() => onArticleTypeChange("page")}
            />
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <span className="text-primary-900 text-base font-medium leading-7">
            {contentTypeLabel || t("admin-posts:metadataForm.contentType")}
          </span>
          <div className="flex flex-row gap-4">
            {contentTypeOptions.includes("html") && (
              <RadioButton
                label="HTML"
                id="content-html"
                name="content-type"
                checked={contentType === "html"}
                onChange={() => onContentTypeChange("html")}
              />
            )}
            {contentTypeOptions.includes("markdown") && (
              <RadioButton
                label="Markdown"
                id="content-markdown"
                name="content-type"
                checked={contentType === "markdown"}
                onChange={() => onContentTypeChange("markdown")}
              />
            )}
            {contentTypeOptions.includes("blocks") && (
              <RadioButton
                label={t("admin-posts:metadataForm.blocks")}
                id="content-blocks"
                name="content-type"
                checked={contentType === "blocks"}
                onChange={() => onContentTypeChange("blocks")}
              />
            )}
          </div>
        </div>

        <KeywordSelectField
          id="article-keywords"
          selectedKeywords={selectedTags}
          keywordOptions={keywordOptions}
          selectedKeywordsRef={selectedKeywordsRef}
          defaultValue={selectedTags.join(",")}
          onSearchChange={onKeywordSearchChange}
          onChange={onKeywordsChange}
          onRemoveKeyword={onRemoveTag}
          hideSectionNames
        />

        <ImageUploadField
          onChange={onImageChange}
          onSecurityError={onImageSecurityError}
          error={imageError}
          previewSrc={previewSrc}
          previewAlt={t("admin-posts:metadataForm.previewAlt")}
        />
      </div>
    </>
  );
}
