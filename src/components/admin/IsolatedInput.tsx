"use client";

import React from "react";
import { InputText } from "@ama-pt/agora-design-system";

/**
 * Isolated InputText wrapper to prevent cursor-jumping bugs.
 *
 * Agora's InputText imperatively sets inputElement.value in an effect,
 * which resets the cursor to the end on every render where value changes.
 *
 * This component fixes it two ways:
 * 1. React.memo — prevents parent re-renders from reaching this component
 *    (only re-renders when its own props change, e.g. hasError).
 * 2. useLayoutEffect cursor restoration — after each render triggered by
 *    the user typing, restores the saved cursor position AFTER Agora's
 *    internal effect runs (effects fire bottom-up: child before parent).
 *
 * It also flips one Agora default. Agora's inputs declare `required = true`
 * and only drop it when the field is `disabled` or `readOnly`, so forwarding an
 * absent `required` marked every optional field as mandatory and blocked the
 * form on it — which is what happened to the harvester config fields. Here the
 * default is `false`, so a field is required only where a caller says so.
 */

interface IsolatedInputProps {
  label: string;
  placeholder?: string;
  id: string;
  defaultValue?: string;
  hasError?: boolean;
  hasFeedback?: boolean;
  feedbackState?: "danger" | "warning" | "success";
  errorFeedbackText?: string;
  required?: boolean;
  maxLength?: number;
  disabled?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  onChange?: (value: string) => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}

const IsolatedInput = React.memo(function IsolatedInput({
  label,
  placeholder,
  id,
  defaultValue,
  hasError,
  hasFeedback,
  feedbackState,
  errorFeedbackText,
  required = false,
  maxLength,
  disabled,
  inputMode,
  onChange,
  onKeyDown,
}: IsolatedInputProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
  const cursorRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (defaultValue !== undefined) {
      setInternalValue(defaultValue);
    }
  }, [defaultValue]);

  React.useLayoutEffect(() => {
    if (cursorRef.current === null) return;
    const input = document.getElementById(id) as HTMLInputElement | null;
    if (input && document.activeElement === input) {
      input.setSelectionRange(cursorRef.current, cursorRef.current);
    }
    cursorRef.current = null;
  });

  return (
    <InputText
      label={label}
      placeholder={placeholder}
      id={id}
      value={internalValue}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        cursorRef.current = e.target.selectionStart;
        const newValue = e.target.value;
        setInternalValue(newValue);
        onChange?.(newValue);
      }}
      onKeyDown={onKeyDown}
      hasError={hasError}
      hasFeedback={hasFeedback}
      feedbackState={feedbackState}
      errorFeedbackText={errorFeedbackText}
      required={required}
      maxLength={maxLength}
      disabled={disabled}
      inputMode={inputMode}
    />
  );
});

export default IsolatedInput;
