import React from "react";
import { useTranslation } from "react-i18next";
import { Button, type DropdownSectionProps } from "@ama-pt/agora-design-system";
import AdminAuxiliarySidebar from "@/components/admin/AdminAuxiliarySidebar";
import AdminVisibilityBanner from "@/components/admin/forms/AdminVisibilityBanner";
import ReusesEditMetadataDangerZone from "@/components/admin/reuses/edit-sections/ReusesEditMetadataDangerZone";
import { can } from "@/utils/permissions";
import ReusesEditMetadataDetailsSection from "@/components/admin/reuses/edit-sections/ReusesEditMetadataDetailsSection";
import { getEditReuseAuxiliarItems } from "@/components/admin/reuses/config/reusesAuxiliarItems";
import type { Reuse, ReuseTopic, ReuseType } from "@/service/types/reuse";
import type { AdminAuxiliaryItem } from "@/service/types/admin/common";

type ReusesEditMetadataTabProps = {
  auxiliaryItems?: AdminAuxiliaryItem[];
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
  formErrors: Partial<Record<string, boolean | string>>;
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
  auxiliaryItems,
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
  const { t } = useTranslation("admin-reuses");
  const canEdit = can(reuse, "edit");
  const canDelete = can(reuse, "delete");
  const auxiliarItems = getEditReuseAuxiliarItems({
    items: auxiliaryItems,
    title: !!formErrors.title,
    link: !!formErrors.url,
    type: !!formErrors.type,
    topic: !!formErrors.topic,
    description: !!formErrors.description,
  });

  return (
    <div className="admin-page__body">
      <div className="admin-page__form-area">
        {reuse.private && canEdit && (
          <AdminVisibilityBanner
            description={
              <>
                <strong>{t("edit.visibilityTitle")}</strong>
                <br />
                {t("edit.visibilityDescription")}
              </>
            }
            actionLabel={t("edit.publishAction")}
            disabled={isSubmitting}
            onAction={onPublishReuse}
          />
        )}

        <form
          className="admin-page__form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void onSaveMetadata();
          }}
        >
          <p className="text-neutral-900 text-base leading-7">{t("edit.draftInfo")}</p>

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

          <div className="admin-page__actions mt-24 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              hasIcon
              trailingIcon="agora-line-check-circle"
              trailingIconHover="agora-solid-check-circle"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("edit.saving") : t("edit.save")}
            </Button>
          </div>

          <ReusesEditMetadataDangerZone
            archived={!!reuse.archived}
            isSubmitting={isSubmitting}
            canEdit={canEdit}
            canDelete={canDelete}
            onArchiveReuse={onArchiveReuse}
            onUnarchiveReuse={onUnarchiveReuse}
            onOpenDeletePopup={onOpenDeletePopup}
          />
        </form>
      </div>

      {auxiliarItems.length > 0 && <AdminAuxiliarySidebar items={auxiliarItems} />}
    </div>
  );
}
