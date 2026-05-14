"use client";

import React from "react";
import { InputTextArea } from "@ama-pt/agora-design-system";

interface IsolatedTextAreaProps {
  label: string;
  placeholder?: string;
  id: string;
  defaultValue?: string;
  rows?: number;
  maxLength?: number;
  showCharCounter?: boolean;
  hasError?: boolean;
  hasFeedback?: boolean;
  feedbackState?: "danger" | "warning" | "success" | "info";
  feedbackText?: string;
  errorFeedbackText?: string;
  required?: boolean;
  onChange?: (value: string) => void;
}

const IsolatedTextArea = React.memo(function IsolatedTextArea({
  label,
  placeholder,
  id,
  defaultValue,
  rows,
  maxLength,
  showCharCounter,
  hasError,
  hasFeedback,
  feedbackState,
  feedbackText,
  errorFeedbackText,
  required,
  onChange,
}: IsolatedTextAreaProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
  const cursorRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (defaultValue !== undefined) {
      setInternalValue(defaultValue);
    }
  }, [defaultValue]);

  React.useLayoutEffect(() => {
    if (cursorRef.current === null) return;
    const input = document.getElementById(id) as HTMLTextAreaElement | null;
    if (input && document.activeElement === input) {
      input.setSelectionRange(cursorRef.current, cursorRef.current);
    }
    cursorRef.current = null;
  });

  return (
    <InputTextArea
      label={label}
      placeholder={placeholder}
      id={id}
      rows={rows}
      maxLength={maxLength}
      showCharCounter={showCharCounter}
      value={internalValue}
      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
        cursorRef.current = e.target.selectionStart;
        const newValue = e.target.value;
        setInternalValue(newValue);
        onChange?.(newValue);
      }}
      hasError={hasError}
      hasFeedback={hasFeedback}
      feedbackState={feedbackState}
      feedbackText={feedbackText}
      errorFeedbackText={errorFeedbackText}
      required={required}
    />
  );
});

export default IsolatedTextArea;
