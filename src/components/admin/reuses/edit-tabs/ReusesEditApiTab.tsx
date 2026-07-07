import React from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("admin-reuses");

  return (
    <div className="admin-page__body mt-24">
      <div className="admin-page__form-area">
        {dataservices && dataservices.length > 0 && (
          <div className="mb-24 space-y-16">
            {dataservices.map((api) => (
              <div
                key={api.id}
                className="flex items-center justify-between rounded-4 border border-neutral-200 p-16"
              >
                <div className="flex items-center gap-12">
                  <AppIcon name="agora-line-code" className="h-24 w-24" />
                  <span className="font-medium text-neutral-900">{api.title}</span>
                </div>
                <button
                  type="button"
                  className="rounded-4 border border-neutral-300 p-8 hover:bg-neutral-100"
                  title={t("edit.apiRemoveTitle")}
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
            label={t("edit.apiSearchLabel")}
            placeholder={t("edit.apiSearchPlaceholder")}
            id="edit-api-search"
            searchable
            searchInputPlaceholder={t("form.datasetSearchInputPlaceholder")}
            searchNoResultsText={t("form.noResults")}
          >
            <DropdownSection name="apis">
              <DropdownOption value="">-</DropdownOption>
            </DropdownSection>
          </InputSelect>

          <div className="admin-page__divider-or">
            <span className="admin-page__divider-or-text">{t("form.or")}</span>
          </div>

          <AdminExternalUrlFields
            entries={apiLinks}
            errors={apiLinkErrors}
            idPrefix="edit-api-url"
            label={t("edit.apiLinkLabel")}
            placeholder={t("edit.apiLinkPlaceholder")}
            removeButtonMarginClassName="mt-24"
            onEntryChange={onApiLinkChange}
            onRemoveEntry={onRemoveApiLink}
            addLabel={t("form.addDatasetLink")}
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
              {isSubmitting ? t("edit.saving") : t("edit.save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
