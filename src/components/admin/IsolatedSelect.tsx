"use client";

import React, { type ReactElement } from "react";
import {
  InputSelect,
  type DropdownSectionProps,
  type DropdownOptionProps,
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
 *
 * The children are cloned to inject `selected={true}` on the matching option
 * so that InputSelect's internal useEffect([children]) re-reads the correct
 * selection state even when the children reference changes.
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
  hideSectionNames?: boolean;
  searchable?: boolean;
  required?: boolean;
  searchInputPlaceholder?: string;
  searchNoResultsText?: string;
  onChangeCallback?: (value: string) => void;
  onSearchCallback?: (query: string) => void;
  children: ReactElement<DropdownSectionProps> | ReactElement<DropdownSectionProps>[];
}

function injectSelected(
  children: ReactElement<DropdownSectionProps> | ReactElement<DropdownSectionProps>[],
  selectedValues: string[]
): ReactElement<DropdownSectionProps> | ReactElement<DropdownSectionProps>[] {
  return React.Children.map(children, (section) => {
    if (!React.isValidElement(section)) return section;
    const sectionEl = section as ReactElement<DropdownSectionProps>;
    const modifiedOptions = React.Children.map(
      sectionEl.props.children as
        | ReactElement<DropdownOptionProps>
        | ReactElement<DropdownOptionProps>[],
      (option) => {
        if (!React.isValidElement(option)) return option;
        const optionEl = option as ReactElement<DropdownOptionProps>;
        const isSelected = selectedValues.includes(String(optionEl.props.value));
        return React.cloneElement(optionEl, { selected: isSelected });
      }
    );
    return React.cloneElement(sectionEl, {}, modifiedOptions);
  }) as ReactElement<DropdownSectionProps>[];
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
  hideSectionNames,
  searchable,
  required,
  searchInputPlaceholder,
  searchNoResultsText,
  onChangeCallback,
  onSearchCallback,
  children,
}: IsolatedSelectProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");

  // Sync defaultValue into state and ref when it changes (e.g. after save)
  React.useEffect(() => {
    if (defaultValue !== undefined) {
      setInternalValue(defaultValue);
      onChangeRef.current = defaultValue;
    }
  }, [defaultValue, onChangeRef]);

  const selectedValues = React.useMemo(
    () => (internalValue ? internalValue.split(",").filter(Boolean) : []),
    [internalValue]
  );

  // Keep a stable snapshot of children while still updating when the actual
  // option list changes. This lets the select render new search results and
  // created tags without losing the selected state.
  const latestChildrenRef = React.useRef(children);
  latestChildrenRef.current = children;

  const childrenWithSelection = React.useMemo(
    () => injectSelected(latestChildrenRef.current, selectedValues),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [latestChildrenRef, selectedValues, children]
  );

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
      onSearchInputChange={
        onSearchCallback
          ? (q) => queueMicrotask(() => onSearchCallback(q))
          : undefined
      }
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
      hideSectionNames={hideSectionNames}
    >
      {childrenWithSelection}
    </InputSelect>
  );
});

export default IsolatedSelect;
