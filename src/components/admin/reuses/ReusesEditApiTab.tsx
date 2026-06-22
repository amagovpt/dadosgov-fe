import React from "react";
import {
  Button,
  DropdownOption,
  DropdownSection,
  InputSelect,
} from "@ama-pt/agora-design-system";
import type { Reuse } from "@/service/types/reuse";
import AdminExternalUrlFields from "@/components/admin/forms/AdminExternalUrlFields";
import AppIcon from "@/components/Primitives/AppIcon";

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
                  <AppIcon name="agora-line-code" className="w-24 h-24" />
                  <span className="text-neutral-900 font-medium">{api.title}</span>
                </div>
                <button
                  type="button"
                  className="border border-neutral-300 rounded-4 p-8 hover:bg-neutral-100"
                  title="Eliminar API"
                >
                  <AppIcon name="agora-line-trash" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          className="admin-page__form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void onSave();
          }}
        >
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

          <AdminExternalUrlFields
            entries={apiLinks}
            errors={apiLinkErrors}
            idPrefix="edit-api-url"
            label="Link para a API"
            placeholder="https://..."
            removeButtonMarginClassName="mt-24"
            onEntryChange={onApiLinkChange}
            onRemoveEntry={onRemoveApiLink}
            addLabel="Adicionar"
            onAddEntry={onAddApiLink}
          />

          <div className="admin-page__actions flex justify-end gap-[18px]">
            <Button
              type="submit"
              variant="primary"
              hasIcon
              trailingIcon="agora-line-check-circle"
              trailingIconHover="agora-solid-check-circle"
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
