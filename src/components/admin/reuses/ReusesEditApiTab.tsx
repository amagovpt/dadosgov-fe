import React from "react";
import {
  Button,
  DropdownOption,
  DropdownSection,
  Icon,
  InputSelect,
  InputText,
} from "@ama-pt/agora-design-system";
import type { Reuse } from "@/types/api";

type ApiLink = { url: string };

type ReusesEditApiTabProps = {
  dataservices: Reuse["dataservices"];
  apiLinks: ApiLink[];
  apiLinkErrors: Record<number, string>;
  isSubmitting: boolean;
  onApiLinkChange: (index: number, value: string) => void;
  onRemoveApiLink: (index: number) => void;
  onAddApiLink: () => void;
  onSave: () => void | Promise<void>;
};

export default function ReusesEditApiTab({
  dataservices,
  apiLinks,
  apiLinkErrors,
  isSubmitting,
  onApiLinkChange,
  onRemoveApiLink,
  onAddApiLink,
  onSave,
}: ReusesEditApiTabProps) {
  return (
    <div className="admin-page__body mt-24">
      <div className="admin-page__form-area">
        {dataservices && dataservices.length > 0 && (
          <div className="space-y-16 mb-24">
            {dataservices.map((api) => (
              <div
                key={api.id}
                className="border border-neutral-200 rounded-4 p-16 flex items-center justify-between"
              >
                <div className="flex items-center gap-12">
                  <Icon name="agora-line-code" className="w-24 h-24" />
                  <span className="text-neutral-900 font-medium">{api.title}</span>
                </div>
                <button
                  type="button"
                  className="border border-neutral-300 rounded-4 p-8 hover:bg-neutral-100"
                  title="Eliminar API"
                >
                  <Icon name="agora-line-trash" className="w-[20px] h-[20px]" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form className="admin-page__form" onSubmit={(e) => e.preventDefault()}>
          <InputSelect
            label="Pesquisar uma API"
            placeholder="Pesquise uma API..."
            id="edit-api-search"
            searchable
            searchInputPlaceholder="Escreva para pesquisar..."
            searchNoResultsText="Nenhum resultado encontrado"
          >
            <DropdownSection name="apis">
              <DropdownOption value="">—</DropdownOption>
            </DropdownSection>
          </InputSelect>

          <div className="admin-page__divider-or">
            <span className="admin-page__divider-or-text">ou</span>
          </div>

          {apiLinks.map((link, index) => (
            <div key={`api-${index}`}>
              <InputText
                label="Link para a API"
                placeholder="https://..."
                id={`edit-api-url-${index}`}
                value={link.url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onApiLinkChange(index, e.target.value)
                }
                hasError={!!apiLinkErrors[index]}
                hasFeedback={!!apiLinkErrors[index]}
                feedbackState="danger"
                errorFeedbackText={apiLinkErrors[index]}
              />
              {link.url.trim() && (
                <div className="flex justify-end mt-24">
                  <Button
                    appearance="solid"
                    variant="danger"
                    hasIcon
                    leadingIcon="agora-line-trash"
                    leadingIconHover="agora-solid-trash"
                    onClick={() => onRemoveApiLink(index)}
                  >
                    Eliminar
                  </Button>
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-end">
            <Button
              appearance="outline"
              variant="primary"
              hasIcon
              leadingIcon="agora-line-plus-circle"
              leadingIconHover="agora-solid-plus-circle"
              onClick={onAddApiLink}
            >
              Adicionar
            </Button>
          </div>

          <div className="admin-page__actions flex justify-end gap-[18px]">
            <Button
              variant="primary"
              hasIcon
              trailingIcon="agora-line-check-circle"
              trailingIconHover="agora-solid-check-circle"
              onClick={onSave}
              disabled={isSubmitting || !apiLinks.some((link) => link.url.trim())}
            >
              {isSubmitting ? "A guardar..." : "Guardar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
