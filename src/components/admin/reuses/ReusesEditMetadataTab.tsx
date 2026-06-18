import React from "react";
import { Button, type DropdownSectionProps } from "@ama-pt/agora-design-system";
import AdminAuxiliarySidebar from "@/components/admin/AdminAuxiliarySidebar";
import ReusesEditMetadataDangerZone from "@/components/admin/reuses/ReusesEditMetadataDangerZone";
import ReusesEditMetadataDetailsSection from "@/components/admin/reuses/ReusesEditMetadataDetailsSection";
import ReusesEditMetadataPublishBanner from "@/components/admin/reuses/ReusesEditMetadataPublishBanner";
import { getReuseAuxiliarItems } from "@/components/admin/reuses/reusesAuxiliarItems";
import type { Reuse, ReuseTopic, ReuseType } from "@/service/types/reuse";

type ReusesEditMetadataTabProps = {
  reuse: Reuse;
  isSubmitting: boolean;
  featured: boolean;
  title: string;
  url: string;
  description: string;
  selectedType: string;
  selectedTopic: string;
  selectedTypeRef: React.MutableRefObject<string>;
  selectedTopicRef: React.MutableRefObject<string>;
  selectedKeywordsRef: React.MutableRefObject<string>;
  selectedKeywordsValue: string;
  selectedKeywords: string[];
  keywordOptions:
    | React.ReactElement<DropdownSectionProps>
    | React.ReactElement<DropdownSectionProps>[];
  imageError: string | null;
  formErrors: Record<string, boolean>;
  reuseTypes: ReuseType[];
  reuseTopics: ReuseTopic[];
  onPublishReuse: () => void | Promise<void>;
  onToggleFeatured: () => void;
  onTitleChange: (value: string) => void;
  onUrlChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onTopicChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onKeywordSearchChange: (value: string) => void;
  onKeywordsChange: (value: string) => void;
  onRemoveKeyword: (keyword: string) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageSecurityError: () => void;
  onSaveMetadata: () => void | Promise<void>;
  onArchiveReuse: () => void | Promise<void>;
  onUnarchiveReuse: () => void | Promise<void>;
  onOpenDeletePopup: () => void;
};

export default function ReusesEditMetadataTab({
  reuse,
  isSubmitting,
  featured,
  title,
  url,
  description,
  selectedType,
  selectedTopic,
  selectedTypeRef,
  selectedTopicRef,
  selectedKeywordsRef,
  selectedKeywordsValue,
  selectedKeywords,
  keywordOptions,
  imageError,
  formErrors,
  reuseTypes,
  reuseTopics,
  onPublishReuse,
  onToggleFeatured,
  onTitleChange,
  onUrlChange,
  onTypeChange,
  onTopicChange,
  onDescriptionChange,
  onKeywordSearchChange,
  onKeywordsChange,
  onRemoveKeyword,
  onImageUpload,
  onImageSecurityError,
  onSaveMetadata,
  onArchiveReuse,
  onUnarchiveReuse,
  onOpenDeletePopup,
}: ReusesEditMetadataTabProps) {
  return (
    <div className="admin-page__body">
      <div className="admin-page__form-area">
        {reuse.private && (
          <ReusesEditMetadataPublishBanner
            isSubmitting={isSubmitting}
            onPublishReuse={onPublishReuse}
          />
        )}

        <form className="admin-page__form" onSubmit={(event) => event.preventDefault()}>
          <p className="text-neutral-900 text-base leading-7">
            Os campos marcados com um asterisco ( * ) são obrigatórios.
          </p>

          <ReusesEditMetadataDetailsSection
            reuse={reuse}
            featured={featured}
            title={title}
            url={url}
            description={description}
            selectedType={selectedType}
            selectedTopic={selectedTopic}
            selectedTypeRef={selectedTypeRef}
            selectedTopicRef={selectedTopicRef}
            selectedKeywordsRef={selectedKeywordsRef}
            selectedKeywordsValue={selectedKeywordsValue}
            selectedKeywords={selectedKeywords}
            keywordOptions={keywordOptions}
            imageError={imageError}
            formErrors={formErrors}
            reuseTypes={reuseTypes}
            reuseTopics={reuseTopics}
            onToggleFeatured={onToggleFeatured}
            onTitleChange={onTitleChange}
            onUrlChange={onUrlChange}
            onTypeChange={onTypeChange}
            onTopicChange={onTopicChange}
            onDescriptionChange={onDescriptionChange}
            onKeywordSearchChange={onKeywordSearchChange}
            onKeywordsChange={onKeywordsChange}
            onRemoveKeyword={onRemoveKeyword}
            onImageUpload={onImageUpload}
            onImageSecurityError={onImageSecurityError}
          />

          <div className="admin-page__actions flex justify-end mt-24">
            <Button
              variant="primary"
              hasIcon
              trailingIcon="agora-line-check-circle"
              trailingIconHover="agora-solid-check-circle"
              onClick={onSaveMetadata}
              disabled={isSubmitting}
            >
              {isSubmitting ? "A guardar..." : "Guardar"}
            </Button>
          </div>

          <ReusesEditMetadataDangerZone
            archived={!!reuse.archived}
            isSubmitting={isSubmitting}
            onArchiveReuse={onArchiveReuse}
            onUnarchiveReuse={onUnarchiveReuse}
            onOpenDeletePopup={onOpenDeletePopup}
          />
        </form>
      </div>

      <AdminAuxiliarySidebar
        items={getReuseAuxiliarItems({
          title: !!formErrors.title,
          link: !!formErrors.url,
          type: !!formErrors.type,
          topic: !!formErrors.topic,
          description: !!formErrors.description,
        })}
      />
    </div>
  );
}
