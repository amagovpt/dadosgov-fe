"use client";

import type { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button, InputText, InputTextArea } from "@ama-pt/agora-design-system";
import type { RemoteDatasetEntry } from "@/lib/reuse-remote-datasets";

interface ReuseExternalDatasetFieldsProps {
  datasetLinks: RemoteDatasetEntry[];
  datasetLinkErrors: Record<number, string>;
  idPrefix: string;
  itemClassName?: string;
  onDatasetUrlChange: (index: number, value: string) => void;
  onDatasetTitleChange: (index: number, value: string) => void;
  onDatasetDescriptionChange: (index: number, value: string) => void;
  onRemoveDatasetLink: (index: number) => void;
}

export default function ReuseExternalDatasetFields({
  datasetLinks,
  datasetLinkErrors,
  idPrefix,
  itemClassName = "flex flex-col gap-16",
  onDatasetUrlChange,
  onDatasetTitleChange,
  onDatasetDescriptionChange,
  onRemoveDatasetLink,
}: ReuseExternalDatasetFieldsProps) {
  const { t } = useTranslation("admin-reuses");

  return (
    <>
      {datasetLinks.map((link, index) => (
        <div key={`dataset-${index}`} className={itemClassName}>
          <InputText
            label={t("form.externalDataset.linkLabel")}
            placeholder={t("form.externalDataset.linkPlaceholder")}
            id={`${idPrefix}-dataset-url-${index}`}
            value={link.url}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onDatasetUrlChange(index, event.target.value)
            }
            hasError={!!datasetLinkErrors[index]}
            hasFeedback={!!datasetLinkErrors[index]}
            feedbackState="danger"
            errorFeedbackText={datasetLinkErrors[index]}
          />
          <InputText
            label={t("form.externalDataset.titleLabel")}
            placeholder={t("form.externalDataset.titlePlaceholder")}
            id={`${idPrefix}-dataset-title-${index}`}
            value={link.title ?? ""}
            required={false}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onDatasetTitleChange(index, event.target.value)
            }
          />
          <InputTextArea
            label={t("form.externalDataset.descriptionLabel")}
            placeholder={t("form.externalDataset.descriptionPlaceholder")}
            id={`${idPrefix}-dataset-description-${index}`}
            value={link.description ?? ""}
            required={false}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
              onDatasetDescriptionChange(index, event.target.value)
            }
          />
          {link.url.trim() && (
            <div className="mt-8 flex justify-end">
              <Button
                type="button"
                appearance="solid"
                variant="danger"
                hasIcon
                leadingIcon="agora-line-trash"
                leadingIconHover="agora-solid-trash"
                onClick={() => onRemoveDatasetLink(index)}
              >
                {t("form.externalDataset.delete")}
              </Button>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
