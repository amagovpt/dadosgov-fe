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

function injectSelected(
  children: ReactElement<DropdownSectionProps> | ReactElement<DropdownSectionProps>[],
  selectedValues: string[]
): ReactElement<DropdownSectionProps> | ReactElement<DropdownSectionProps>[] {
  return React.Children.map(children, (section) => {
    if (!React.isValidElement(section)) return section;
    const sectionEl = section as ReactElement<DropdownSectionProps>;
    const modifiedOptions = React.Children.map(
      sectionEl.props.children as ReactElement<DropdownOptionProps> | ReactElement<DropdownOptionProps>[],
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

  // Keep a stable snapshot of children that only updates when the selection changes.
  // For non-searchable selects: depending only on `internalValue` keeps the children
  // reference stable across unrelated parent re-renders (e.g. typing in a sibling
  // input), so InputSelect's internal useEffect([children]) does not reset selection.
  // For searchable selects: the option list legitimately changes as the user types in
  // the search field, so we must also track `children` identity — otherwise the new
  // search results never make it into the dropdown until the component is remounted.
  // Callers that pass `searchable` are expected to memoize their children via
  // useMemo so the reference is stable across unrelated re-renders.
  const latestChildrenRef = React.useRef(children);
  latestChildrenRef.current = children;

  const childrenWithSelection = React.useMemo(
    () => injectSelected(latestChildrenRef.current, selectedValues),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [internalValue, searchable ? children : null]
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
      {childrenWithSelection}
    </InputSelect>
  );
});

export default IsolatedSelect;
