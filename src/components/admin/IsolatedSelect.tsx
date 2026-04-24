"use client";

import React, { type ReactElement } from "react";
import {
  InputSelect,
  type DropdownSectionProps,
} from "@ama-pt/agora-design-system";

/**
 * Isolated InputSelect wrapper to prevent re-render cascades.
 *
 * The Agora Design System InputSelect calls setState during the render cycle
 * of other components (React 19 incompatibility), causing sibling selects to
 * lose their selection when any form field triggers a re-render.
 *
 * This component wraps InputSelect in React.memo so it only re-renders when
 * its own props change. Values are stored via a MutableRefObject to avoid
 * triggering parent re-renders on selection.
 */

interface IsolatedSelectProps {
  label: string;
  placeholder: string;
  id: string;
  onChangeRef: React.MutableRefObject<string>;
  defaultValue?: string;
  type?: "checkbox" | "text";
  hasError?: boolean;
  errorFeedbackText?: string;
  hideLabel?: boolean;
  searchable?: boolean;
  required?: boolean;
  searchInputPlaceholder?: string;
  searchNoResultsText?: string;
  onChangeCallback?: (value: string) => void;
  onSearchCallback?: (query: string) => void;
  children:
  | ReactElement<DropdownSectionProps>
  | ReactElement<DropdownSectionProps>[];
}

const IsolatedSelect = React.memo(function IsolatedSelect({
  label,
  placeholder,
  id,
  onChangeRef,
  defaultValue,
  type,
  hasError,
  errorFeedbackText,
  hideLabel,
  searchable,
  required,
  searchInputPlaceholder,
  searchNoResultsText,
  onChangeCallback,
  onSearchCallback,
  children,
}: IsolatedSelectProps) {
  // Sync defaultValue into the ref when it changes so handleSave reads the correct value
  React.useEffect(() => {
    if (defaultValue !== undefined) {
      onChangeRef.current = defaultValue;
    }
  }, [defaultValue, onChangeRef]);

  const [internalValue, setInternalValue] = React.useState(defaultValue || "");

  // Update internal state if defaultValue prop changes (e.g. after save)
  React.useEffect(() => {
    if (defaultValue !== undefined) {
      setInternalValue(defaultValue);
    }
  }, [defaultValue]);

  return (
    <InputSelect
      label={label}
      placeholder={placeholder}
      id={id}
      type={type}
      hideLabel={hideLabel}
      searchable={searchable}
      searchInputPlaceholder={searchInputPlaceholder}
      searchNoResultsText={searchNoResultsText}
      value={internalValue !== undefined ? (typeof internalValue === "string" && internalValue !== "" ? (type === "checkbox" ? internalValue.split(",") : [internalValue]) : internalValue) : undefined}
      onSearchInputChange={onSearchCallback}
      onChange={(options) => {
        const value = options.map((o) => o.value as string).join(",");
        setInternalValue(value);
        onChangeRef.current = value;
        onChangeCallback?.(value);
      }}
      hasError={hasError}
      hasFeedback={hasError}
      feedbackState="danger"
      errorFeedbackText={errorFeedbackText}
      required={required}
    >
      {children}
    </InputSelect>
  );
});

export default IsolatedSelect;
