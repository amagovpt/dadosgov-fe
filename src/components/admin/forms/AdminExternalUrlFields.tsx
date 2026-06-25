"use client";

import type { ChangeEvent } from "react";
import { Button, InputText } from "@ama-pt/agora-design-system";

interface ExternalUrlEntry {
  url: string;
}

interface AdminExternalUrlFieldsProps {
  entries: ExternalUrlEntry[];
  errors: Record<number, string>;
  idPrefix: string;
  label: string;
  placeholder: string;
  itemClassName?: string;
  removeButtonAppearance?: "solid" | "outline" | "link";
  removeButtonMarginClassName?: string;
  onEntryChange: (index: number, value: string) => void;
  onRemoveEntry: (index: number) => void;
  addLabel?: string;
  onAddEntry?: () => void;
}

export default function AdminExternalUrlFields({
  entries,
  errors,
  idPrefix,
  label,
  placeholder,
  itemClassName = "",
  removeButtonAppearance = "solid",
  removeButtonMarginClassName = "mt-8",
  onEntryChange,
  onRemoveEntry,
  addLabel,
  onAddEntry,
}: AdminExternalUrlFieldsProps) {
  return (
    <>
      {entries.map((entry, index) => (
        <div key={`${idPrefix}-${index}`} className={itemClassName}>
          <InputText
            label={label}
            placeholder={placeholder}
            id={`${idPrefix}-${index}`}
            value={entry.url}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onEntryChange(index, event.target.value)
            }
            hasError={!!errors[index]}
            hasFeedback={!!errors[index]}
            feedbackState="danger"
            errorFeedbackText={errors[index]}
          />
          {entry.url.trim() && (
            <div className={`${removeButtonMarginClassName} flex justify-end`}>
              <Button
                type="button"
                appearance={removeButtonAppearance}
                variant="danger"
                hasIcon
                leadingIcon="agora-line-trash"
                leadingIconHover="agora-solid-trash"
                onClick={() => onRemoveEntry(index)}
              >
                Eliminar
              </Button>
            </div>
          )}
        </div>
      ))}

      {addLabel && onAddEntry ? (
        <div className="flex justify-end">
          <Button
            type="button"
            appearance="outline"
            variant="primary"
            hasIcon
            leadingIcon="agora-line-plus-circle"
            leadingIconHover="agora-solid-plus-circle"
            onClick={onAddEntry}
          >
            {addLabel}
          </Button>
        </div>
      ) : null}
    </>
  );
}
