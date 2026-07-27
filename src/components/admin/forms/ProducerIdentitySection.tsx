"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import type { DropdownSectionProps } from "@ama-pt/agora-design-system";
import AppIcon from "@/components/Primitives/AppIcon";
import AdminSelectAdapter from "@/components/admin/AdminSelectAdapter";

interface ProducerIdentitySectionProps {
  producerOptions:
    | React.ReactElement<DropdownSectionProps>
    | React.ReactElement<DropdownSectionProps>[];
  selectedProducerRef?: React.RefObject<string>;
  initialValue?: string;
  onValueChange?: (value: string) => void;
  helperDescription: React.ReactNode;
}

export default function ProducerIdentitySection({
  producerOptions,
  selectedProducerRef,
  initialValue,
  onValueChange,
  helperDescription,
}: ProducerIdentitySectionProps) {
  const { t } = useTranslation("admin-common");

  return (
    <>
      <h2 className="admin-page__section-title">{t("forms.producerTitle")}</h2>

      <AdminSelectAdapter
        label={t("forms.producerLabel")}
        placeholder={t("forms.producerPlaceholder")}
        id="producer-identity"
        valueRef={selectedProducerRef}
        initialValue={initialValue}
        onValueChange={onValueChange}
      >
        {producerOptions}
      </AdminSelectAdapter>

      <div className="admin-page__org-card">
        <p className="admin-page__org-card-title">{t("forms.noOrganizationTitle")}</p>
        <p className="admin-page__org-card-description">{helperDescription}</p>
        <Link href="/admin/organizations/new" className="admin-page__org-card-link">
          {t("forms.organizationLink")}
          <AppIcon name="agora-line-arrow-right-circle" className="h-24 w-24" />
        </Link>
      </div>
    </>
  );
}
