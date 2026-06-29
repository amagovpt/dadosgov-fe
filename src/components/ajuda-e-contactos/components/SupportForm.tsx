"use client";

import React from "react";
import {
  InputText,
  InputTextArea,
  Button,
  StatusCard,
  DropdownSection,
  DropdownOption,
} from "@ama-pt/agora-design-system";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import {
  TOGGLE_TITLE_MAP,
  TOGGLE_INFO_MESSAGE_MAP,
  TOGGLE_SUBJECT_LABEL_MAP,
  TOGGLE_CONTENT_LABEL_MAP,
  TOGGLE_CATEGORIES_MAP,
  TOGGLE_PREFIX_MAP,
} from "../constants";
import type { SupportFormErrors } from "../types";

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
}: SupportFormProps) {
  const prefix = TOGGLE_PREFIX_MAP[selectedToggle];

  return (
    <div className="mt-32 max-w-2xl">
      <h3 className="mb-24 text-[20px] font-bold text-[#021C51]">
        {TOGGLE_TITLE_MAP[selectedToggle]}
      </h3>

      {TOGGLE_INFO_MESSAGE_MAP[selectedToggle] && (
        <div className="mb-24">
          <StatusCard
            variant="informative"
            showIcon
            description={TOGGLE_INFO_MESSAGE_MAP[selectedToggle]}
          />
        </div>
      )}

      <div>
        <div className="mt-[20px]">
          <InputText
            label="O seu e-mail *"
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
            label="Categoria *"
            placeholder="Selecione uma categoria..."
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
              {(TOGGLE_CATEGORIES_MAP[selectedToggle] ?? []).map((cat) => (
                <DropdownOption key={cat} value={cat}>
                  {cat}
                </DropdownOption>
              ))}
            </DropdownSection>
          </IsolatedSelect>
        </div>

        <div className="mt-[20px]">
          <InputText
            label={TOGGLE_SUBJECT_LABEL_MAP[selectedToggle]}
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

        {selectedToggle === "bug" && (
          <>
            <div className="mt-[20px]">
              <InputText
                label="Página ou URL onde ocorreu o problema"
                placeholder="https://dados.gov.pt/..."
                value={problemUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setProblemUrl(e.target.value)
                }
              />
            </div>

            <div className="mt-[20px]">
              <InputText
                label="Data/hora aproximada"
                placeholder="Ex.: 05/06/2026 14:30"
                value={problemDateTime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setProblemDateTime(e.target.value)
                }
              />
            </div>
          </>
        )}

        <div className="mt-[20px]">
          <InputTextArea
            label={TOGGLE_CONTENT_LABEL_MAP[selectedToggle]}
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
            {isSubmitting ? "A enviar..." : "Enviar"}
          </Button>
        </div>

        {errorMessage && (
          <div className="mt-[20px]">
            <StatusCard variant="danger" description={errorMessage} />
          </div>
        )}
      </div>
    </div>
  );
}
