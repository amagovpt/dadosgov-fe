"use client";

import React from "react";

type ClearErrorFn<FieldName extends string> = (field: FieldName) => void;

export function handleRequiredTextFieldChange<FieldName extends string>(
  event: React.ChangeEvent<HTMLInputElement>,
  setValue: React.Dispatch<React.SetStateAction<string>>,
  clearError: ClearErrorFn<FieldName>,
  fieldName: FieldName,
) {
  const nextValue = event.target.value;
  setValue(nextValue);

  if (nextValue.trim()) {
    clearError(fieldName);
  }
}

export function handleTextFieldChange(
  event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  setValue: React.Dispatch<React.SetStateAction<string>>,
) {
  setValue(event.target.value);
}

export function handleSchemaUrlFieldChange(
  event: React.ChangeEvent<HTMLInputElement>,
  setSchemaUrl: React.Dispatch<React.SetStateAction<string>>,
  selectedSchemaRef?: React.RefObject<string>,
) {
  const nextValue = event.target.value;
  setSchemaUrl(nextValue);

  if (selectedSchemaRef && nextValue) {
    selectedSchemaRef.current = "";
  }
}
