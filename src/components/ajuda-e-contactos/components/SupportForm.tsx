"use client";

import React from "react";
import {
  Button,
  DropdownOption,
  DropdownSection,
  InputText,
  InputTextArea,
  StatusCard,
} from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import type { SupportCardContent } from "@/service/types/support";
import type { SupportFormErrors } from "../hooks/useSupportForm";

interface SupportFormProps {
  selectedToggle: string;
  email: string;
  subjectBody: string;
  description: string;
  category: string;
  problemUrl: string;
  problemDateTime: string;
  errors: SupportFormErrors;
  errorMessage: string;
  isSubmitting: boolean;
  setEmail: (v: string) => void;
  setSubjectBody: (v: string) => void;
  setDescription: (v: string) => void;
  setCategory: (v: string) => void;
  setProblemUrl: (v: string) => void;
  setProblemDateTime: (v: string) => void;
  setErrors: React.Dispatch<React.SetStateAction<SupportFormErrors>>;
  handleSubmit: () => Promise<void>;
  infoCard?: SupportCardContent | null;
}

export function SupportForm({
  selectedToggle,
  email,
  subjectBody,
  description,
  category,
  problemUrl,
  problemDateTime,
  errors,
  errorMessage,
  isSubmitting,
  setEmail,
  setSubjectBody,
  setDescription,
  setCategory,
  setProblemUrl,
  setProblemDateTime,
  setErrors,
  handleSubmit,
  infoCard,
}: SupportFormProps) {
  const { t } = useTranslation("support");
  const prefix = t(`form.prefix.${selectedToggle}`);
  const categories = t(`form.categories.${selectedToggle}`, {
    returnObjects: true,
  }) as string[];

  return (
    <div className="mt-32 max-w-2xl">
      <h3 className="mb-24 text-[20px] font-bold text-[#021C51]">
        {t(`form.title.${selectedToggle}`)}
      </h3>

      {infoCard ? (
        <div className="mb-24">
          <StatusCard
            variant="informative"
            showIcon
            description={
              <div className="flex flex-col gap-8">
                {infoCard.title ? <p className="font-bold">{infoCard.title}</p> : null}
                {formatHtmlParagraphs(infoCard.description ?? "")}
              </div>
            }
          />
        </div>
      ) : null}

      <div>
        <div className="mt-[20px]">
          <InputText
            label={t("form.emailLabel")}
            type="email"
            required
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setEmail(e.target.value);
              if (e.target.value.trim()) setErrors((prev) => ({ ...prev, email: "" }));
            }}
            hasError={!!errors.email}
            errorFeedbackText={errors.email}
          />
        </div>

        <div className="mt-[20px]">
          <IsolatedSelect
            key={`category-${selectedToggle}`}
            label={t("form.categoryLabel")}
            placeholder={t("form.categoryPlaceholder")}
            id="support-category"
            defaultValue={category}
            required
            hasError={!!errors.category}
            errorFeedbackText={errors.category}
            onChangeCallback={(value) => {
              setCategory(value);
              if (value) setErrors((prev) => ({ ...prev, category: "" }));
            }}
          >
            <DropdownSection name="categories">
              {categories.map((cat) => (
                <DropdownOption key={cat} value={cat}>
                  {cat}
                </DropdownOption>
              ))}
            </DropdownSection>
          </IsolatedSelect>
        </div>

        <div className="mt-[20px]">
          <InputText
            label={t(`form.subjectLabel.${selectedToggle}`)}
            value={`${prefix} - ${subjectBody}`}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const pfx = `${prefix} - `;
              if (e.target.value.startsWith(pfx)) {
                const body = e.target.value.slice(pfx.length);
                setSubjectBody(body);
                if (body.trim()) setErrors((prev) => ({ ...prev, subject: "" }));
              }
            }}
            onSelect={(e: React.SyntheticEvent<HTMLInputElement>) => {
              const pfx = `${prefix} - `;
              const input = e.currentTarget;
              if (input.selectionStart !== null && input.selectionStart < pfx.length) {
                input.setSelectionRange(
                  pfx.length,
                  Math.max(pfx.length, input.selectionEnd ?? pfx.length)
                );
              }
            }}
            hasError={!!errors.subject}
            errorFeedbackText={errors.subject}
            required
          />
        </div>

        {selectedToggle === "bug" ? (
          <>
            <div className="mt-[20px]">
              <InputText
                label={t("form.problemUrlLabel")}
                placeholder={t("form.problemUrlPlaceholder")}
                value={problemUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setProblemUrl(e.target.value)
                }
              />
            </div>

            <div className="mt-[20px]">
              <InputText
                label={t("form.problemDateTimeLabel")}
                placeholder={t("form.problemDateTimePlaceholder")}
                value={problemDateTime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setProblemDateTime(e.target.value)
                }
              />
            </div>
          </>
        ) : null}

        <div className="mt-[20px]">
          <InputTextArea
            label={t(`form.contentLabel.${selectedToggle}`)}
            required
            rows={5}
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              setDescription(e.target.value);
              if (e.target.value.trim()) setErrors((prev) => ({ ...prev, description: "" }));
            }}
            hasError={!!errors.description}
            errorFeedbackText={errors.description}
          />
        </div>

        <div className="mt-[20px]">
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? t("form.sending") : t("form.submit")}
          </Button>
        </div>

        {errorMessage ? (
          <div className="mt-[20px]">
            <StatusCard variant="danger" description={errorMessage} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
