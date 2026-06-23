"use client";

import React from "react";
import type { DropdownSectionProps } from "@ama-pt/agora-design-system";
import { Button, InputText } from "@ama-pt/agora-design-system";
import AdminSelectAdapter from "@/components/admin/AdminSelectAdapter";

interface ChecksumSectionProps {
  resourceId: string;
  saveCount: number;
  showChecksum: boolean;
  checksumType: string;
  checksumValue: string;
  checksumOptions:
    | React.ReactElement<DropdownSectionProps>
    | React.ReactElement<DropdownSectionProps>[];
  selectedChecksumTypeRef: React.RefObject<string>;
  hasChecksumValueError: boolean;
  onShowChecksum: () => void;
  onRemoveChecksum: () => void;
  onChecksumTypeChange: (value: string) => void;
  onChecksumValueChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ChecksumSection({
  resourceId,
  saveCount,
  showChecksum,
  checksumType,
  checksumValue,
  checksumOptions,
  selectedChecksumTypeRef,
  hasChecksumValueError,
  onShowChecksum,
  onRemoveChecksum,
  onChecksumTypeChange,
  onChecksumValueChange,
}: ChecksumSectionProps) {
  return (
    <>
      <div className="flex flex-col items-start gap-12">
        <h2 className="admin-page__section-title mb-0">Selo de verificação</h2>
        {showChecksum ? (
          <Button
            variant="danger"
            appearance="outline"
            hasIcon
            leadingIcon="agora-line-trash"
            leadingIconHover="agora-solid-trash"
            onClick={onRemoveChecksum}
          >
            Eliminar
          </Button>
        ) : (
          <Button
            variant="primary"
            appearance="outline"
            hasIcon
            leadingIcon="agora-line-plus"
            leadingIconHover="agora-solid-plus"
            onClick={onShowChecksum}
          >
            Adicionar
          </Button>
        )}
      </div>

      {showChecksum && (
        <div className="admin-page__fields-group">
          <AdminSelectAdapter
            key={`checksum-${resourceId}-${saveCount}`}
            label="Tipo de soma de verificação"
            placeholder="SHA1"
            id="checksum-type"
            initialValue={checksumType}
            valueRef={selectedChecksumTypeRef}
            onValueChange={onChecksumTypeChange}
          >
            {checksumOptions}
          </AdminSelectAdapter>

          <InputText
            label="Valor de checksum *"
            placeholder="Introduza o valor do hash"
            id="checksum-value"
            value={checksumValue}
            onChange={onChecksumValueChange}
            hasError={hasChecksumValueError}
            hasFeedback={hasChecksumValueError}
            feedbackState="danger"
            errorFeedbackText="Campo obrigatório"
          />
        </div>
      )}
    </>
  );
}
