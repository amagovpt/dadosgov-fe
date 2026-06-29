"use client";

import React from "react";
import type { DropdownSectionProps } from "@ama-pt/agora-design-system";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import AdminFieldError from "@/components/admin/AdminFieldError";

interface AdminSelectAdapterProps {
  label: string;
  placeholder: string;
  id: string;
  valueRef?: React.RefObject<string>;
  initialValue?: string;
  type?: "checkbox" | "text";
  hasError?: boolean;
  errorMessage?: string;
  renderErrorBelow?: boolean;
  hideLabel?: boolean;
  hideSectionNames?: boolean;
  searchable?: boolean;
  required?: boolean;
  searchInputPlaceholder?: string;
  searchNoResultsText?: string;
  onValueChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  children:
    | React.ReactElement<DropdownSectionProps>
    | React.ReactElement<DropdownSectionProps>[];
}

export default function AdminSelectAdapter({
  label,
  placeholder,
  id,
  valueRef,
  initialValue,
  type,
  hasError,
  errorMessage,
  renderErrorBelow = false,
  hideLabel,
  hideSectionNames,
  searchable,
  required,
  searchInputPlaceholder,
  searchNoResultsText,
  onValueChange,
  onSearch,
  children,
}: AdminSelectAdapterProps) {
  return (
    <div>
      <IsolatedSelect
        label={label}
        placeholder={placeholder}
        id={id}
        onChangeRef={valueRef}
        defaultValue={initialValue}
        type={type}
        hasError={renderErrorBelow ? false : hasError}
        errorFeedbackText={renderErrorBelow ? undefined : errorMessage}
        hideLabel={hideLabel}
        hideSectionNames={hideSectionNames}
        searchable={searchable}
        required={required}
        searchInputPlaceholder={searchInputPlaceholder}
        searchNoResultsText={searchNoResultsText}
        onChangeCallback={onValueChange}
        onSearchCallback={onSearch}
      >
        {children}
      </IsolatedSelect>

      {renderErrorBelow && hasError && <AdminFieldError message={errorMessage} />}
    </div>
  );
}
