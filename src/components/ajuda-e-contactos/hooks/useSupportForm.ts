"use client";

import React from "react";
import { submitSupportContact, type SupportTopic } from "@/service/api/system";
import { TOGGLE_SUCCESS_MAP } from "../constants";
import { shouldPreselectFeedbackFromUrl, composeMessage } from "../utils";
import type { SupportFormErrors } from "../types";

interface UseSupportFormOptions {
  executeRecaptcha: ((action?: string) => Promise<string>) | undefined;
}

export interface SupportFormState {
  selectedToggle: string | null;
  email: string;
  subjectBody: string;
  description: string;
  category: string;
  problemUrl: string;
  problemDateTime: string;
  errors: SupportFormErrors;
  successMessage: string;
  errorMessage: string;
  isSubmitting: boolean;
}

export interface SupportFormHandlers {
  setSelectedToggle: (toggle: string | null) => void;
  setEmail: (v: string) => void;
  setSubjectBody: (v: string) => void;
  setDescription: (v: string) => void;
  setCategory: (v: string) => void;
  setProblemUrl: (v: string) => void;
  setProblemDateTime: (v: string) => void;
  setErrors: React.Dispatch<React.SetStateAction<SupportFormErrors>>;
  setSuccessMessage: (v: string) => void;
  setErrorMessage: (v: string) => void;
  resetFormFields: () => void;
  handleSubmit: () => Promise<void>;
}

export function useSupportForm({ executeRecaptcha }: UseSupportFormOptions): SupportFormState & SupportFormHandlers {
  const [selectedToggle, setSelectedToggle] = React.useState<string | null>(() =>
    shouldPreselectFeedbackFromUrl() ? "feedback" : null
  );
  const [email, setEmail] = React.useState("");
  const [subjectBody, setSubjectBody] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [problemUrl, setProblemUrl] = React.useState("");
  const [problemDateTime, setProblemDateTime] = React.useState("");
  const [errors, setErrors] = React.useState<SupportFormErrors>({
    email: "",
    subject: "",
    description: "",
    category: "",
  });
  const [successMessage, setSuccessMessage] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const resetFormFields = React.useCallback(() => {
    setSelectedToggle(null);
    setEmail("");
    setSubjectBody("");
    setDescription("");
    setCategory("");
    setProblemUrl("");
    setProblemDateTime("");
    setErrors({ email: "", subject: "", description: "", category: "" });
  }, []);

  const handleSubmit = React.useCallback(async () => {
    if (!selectedToggle || selectedToggle === "dataset") return;

    const newErrors: SupportFormErrors = {
      email: email.trim() ? "" : "Campo obrigatório",
      subject: subjectBody.trim() ? "" : "Campo obrigatório",
      description: description.trim() ? "" : "Campo obrigatório",
      category: category ? "" : "Campo obrigatório",
    };
    setErrors(newErrors);
    const hasErrors = Object.values(newErrors).some(Boolean);
    if (hasErrors) return;

    setErrorMessage("");
    setIsSubmitting(true);
    try {
      let recaptchaToken: string | null = null;
      if (executeRecaptcha) {
        try {
          recaptchaToken = await executeRecaptcha("support_contact");
        } catch (err) {
          console.warn("reCAPTCHA execution failed:", err);
        }
      }

      await submitSupportContact({
        topic: selectedToggle as SupportTopic,
        email: email.trim(),
        subject: subjectBody.trim(),
        message: composeMessage(description, category, selectedToggle, problemUrl, problemDateTime),
        recaptchaToken,
      });
      setSuccessMessage(TOGGLE_SUCCESS_MAP[selectedToggle]);
      resetFormFields();
    } catch (err) {
      console.error("Support form submission failed:", err);
      setErrorMessage(
        "Não foi possível enviar o seu pedido. Tente novamente em alguns instantes."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedToggle,
    email,
    subjectBody,
    description,
    category,
    problemUrl,
    problemDateTime,
    executeRecaptcha,
    resetFormFields,
  ]);

  return {
    selectedToggle,
    email,
    subjectBody,
    description,
    category,
    problemUrl,
    problemDateTime,
    errors,
    successMessage,
    errorMessage,
    isSubmitting,
    setSelectedToggle,
    setEmail,
    setSubjectBody,
    setDescription,
    setCategory,
    setProblemUrl,
    setProblemDateTime,
    setErrors,
    setSuccessMessage,
    setErrorMessage,
    resetFormFields,
    handleSubmit,
  };
}
