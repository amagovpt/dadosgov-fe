"use client";

import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import {
  Button,
  Dialog,
  DropdownOption,
  DropdownSection,
  Icon,
  InputText,
  StatusCard,
  type DialogElement,
} from "@ama-pt/agora-design-system";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import { createContactPoint, updateContactPoint } from "@/service/api/organizations";
import type { ContactPoint, ContactPointCreatePayload } from "@/service/types/dataset";

// Supported by the contact point API and translated in the datasets namespace.
const CONTACT_ROLES = [
  "contact",
  "creator",
  "publisher",
  "rightsHolder",
  "custodian",
  "distributor",
  "originator",
  "principalInvestigator",
  "processor",
  "resourceProvider",
  "user",
];
type ContactField = "name" | "role" | "email" | "url";

interface DatasetContactModalProps {
  producerId: string;
  contact?: ContactPoint;
  onSaved: (contact: ContactPoint) => void;
  onClose: () => void;
}

export function DatasetContactModal({
  producerId,
  contact,
  onSaved,
  onClose,
}: DatasetContactModalProps) {
  const { t } = useTranslation(["admin-datasets", "datasets"]);
  const titleId = useId();
  const dialogRef = useRef<DialogElement>(null);
  const [name, setName] = useState(contact?.name ?? "");
  const [role, setRole] = useState(contact?.role ?? "");
  const roleRef = useRef(role);
  const [email, setEmail] = useState(contact?.email ?? "");
  const [url, setUrl] = useState(contact?.contact_form ?? "");
  const [errors, setErrors] = useState<Partial<Record<ContactField, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const submittingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  useLayoutEffect(() => {
    const ownDialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    // Other Agora dialogs can reset the body class when responsive navigation remounts.
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      const anotherDialogOpen = Array.from(
        document.querySelectorAll(".agora-dialog:not(.closed)")
      ).some((dialog) => dialog !== ownDialog);
      document.body.classList.toggle("overflow-hidden", anotherDialogOpen);
    };
  }, []);
  const roleOptions = useMemo(
    () => (
      <DropdownSection name="contact-roles">
        {CONTACT_ROLES.map((value) => (
          <DropdownOption key={value} value={value} selected={role === value}>
            {t(`datasets:contactRoles.${value}`)}
          </DropdownOption>
        ))}
      </DropdownSection>
    ),
    [role, t]
  );

  function clearError(field: ContactField) {
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  }

  function close() {
    dialogRef.current?.hide();
  }

  async function saveContact() {
    if (submittingRef.current) return;
    const nextErrors: Partial<Record<ContactField, string>> = {};
    const required = t("admin-datasets:form.fieldRequired");
    if (!name.trim()) nextErrors.name = required;
    if (!roleRef.current) nextErrors.role = required;
    if (!email.trim() && !url.trim()) {
      nextErrors.email = t("admin-datasets:contacts.oneContactRequired");
      nextErrors.url = t("admin-datasets:contacts.oneContactRequired");
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      nextErrors.email = t("admin-datasets:contacts.invalidEmail");
    if (url.trim()) {
      try {
        const parsed = new URL(url.trim());
        if (!["https:", "http:"].includes(parsed.protocol)) throw new Error("Invalid protocol");
      } catch {
        nextErrors.url = t("admin-datasets:contacts.invalidUrl");
      }
    }
    setErrors(nextErrors);
    setApiError(null);
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      );
      return;
    }

    submittingRef.current = true;
    setSaving(true);
    try {
      const payload: ContactPointCreatePayload = {
        name: name.trim(),
        role: roleRef.current,
        organization: producerId,
        email: email.trim(),
        contact_form: url.trim(),
      };
      const saved = contact
        ? await updateContactPoint(contact.id, payload)
        : await createContactPoint(payload);
      onSaved(saved);
      close();
    } catch {
      setApiError(t("admin-datasets:contacts.saveError"));
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  }

  const form = (
    <form
      ref={formRef}
      className="mx-auto flex w-full max-w-[1008px] flex-col gap-32 md:gap-64"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void saveContact();
      }}
    >
      <h2 id={titleId} className="text-2xl-bold">
        {t(contact ? "admin-datasets:contacts.edit" : "admin-datasets:form.addContactAction")}
      </h2>
      {apiError && <StatusCard variant="danger" showIcon description={apiError} />}
      <section className="flex flex-col gap-32">
        <div className="flex flex-col gap-16 [&_h3]:text-xl-bold [&_p]:text-m-regular">
          <h3>{t("admin-datasets:contacts.identificationTitle")}</h3>
          <p>{t("admin-datasets:contacts.allRequired")}</p>
        </div>
        <div className="grid grid-cols-1 items-start gap-32 md:grid-cols-2 [&>*]:min-w-0">
          <InputText
            id="dataset-contact-name"
            label={t("admin-datasets:contacts.name")}
            value={name}
            disabled={saving}
            onChange={(event) => {
              setName(event.target.value);
              clearError("name");
            }}
            maxLength={255}
            required
            hasError={!!errors.name}
            hasFeedback={!!errors.name}
            feedbackState="danger"
            errorFeedbackText={errors.name}
          />
          <IsolatedSelect
            id="dataset-contact-role"
            label={t("admin-datasets:contacts.role")}
            placeholder={t("admin-datasets:contacts.rolePlaceholder")}
            defaultValue={role}
            onChangeRef={roleRef}
            onChangeCallback={(value) => {
              setRole(value);
              clearError("role");
            }}
            hasError={!!errors.role}
            errorFeedbackText={errors.role}
            required
            hideSectionNames
          >
            {roleOptions}
          </IsolatedSelect>
        </div>
      </section>
      <section className="flex flex-col gap-32">
        <div className="flex flex-col gap-16 [&_h3]:text-xl-bold [&_p]:text-m-regular">
          <h3>{t("admin-datasets:contacts.detailsTitle")}</h3>
          <p>{t("admin-datasets:contacts.oneRequired")}</p>
        </div>
        <div className="grid grid-cols-1 items-start gap-32 md:grid-cols-2 [&>*]:min-w-0">
          <InputText
            id="dataset-contact-email"
            type="email"
            label="Email"
            placeholder="exemplo@email.com"
            value={email}
            disabled={saving}
            onChange={(event) => {
              setEmail(event.target.value);
              clearError("email");
              clearError("url");
            }}
            maxLength={255}
            required={false}
            hasError={!!errors.email}
            hasFeedback={!!errors.email}
            feedbackState="danger"
            errorFeedbackText={errors.email}
          />
          <div className="flex flex-col gap-8">
            <InputText
              id="dataset-contact-url"
              type="url"
              label={t("admin-datasets:contacts.url")}
              placeholder="https://"
              value={url}
              disabled={saving}
              onChange={(event) => {
                setUrl(event.target.value);
                clearError("email");
                clearError("url");
              }}
              required={false}
              hasError={!!errors.url}
              hasFeedback={!!errors.url}
              feedbackState="danger"
              errorFeedbackText={errors.url}
              aria-describedby="dataset-contact-url-hint"
            />
            <p
              id="dataset-contact-url-hint"
              className="flex items-start gap-8 text-s-regular text-neutral-700"
            >
              <Icon
                name="agora-solid-info-mark"
                dimensions="s"
                className="my-4 size-16 shrink-0 fill-informative-500!"
              />
              {t("admin-datasets:contacts.urlHint")}
            </p>
          </div>
        </div>
      </section>
      <div className="flex flex-wrap items-center justify-end gap-16">
        <Button
          type="button"
          appearance="link"
          variant="neutral"
          className="py-[14px]"
          disabled={saving}
          onClick={close}
        >
          {t("admin-datasets:contacts.cancel")}
        </Button>
        <Button
          type="submit"
          variant="primary"
          hasIcon
          className="py-[14px]"
          leadingIcon="agora-line-check-circle"
          leadingIconHover="agora-solid-check-circle"
          disabled={saving}
        >
          {t(saving ? "admin-datasets:contacts.saving" : "admin-datasets:form.saveContactAction")}
        </Button>
      </div>
    </form>
  );

  return createPortal(
    <Dialog ref={dialogRef} visible fullScreen onHide={onClose} aria-labelledby={titleId}>
      <div className="h-full w-full overflow-y-auto bg-white text-neutral-900">
        <div className="mx-auto min-h-full w-full max-w-[1440px]">
          <div className="flex h-[76px] items-start justify-end px-16 pt-16">
            <Button
              type="button"
              appearance="link"
              variant="neutral"
              hasIcon
              trailingIcon="agora-line-x"
              trailingIconHover="agora-solid-x"
              className="py-[14px]"
              onClick={close}
            >
              {t("admin-datasets:edit.closeAriaLabel")}
            </Button>
          </div>
          <div className="px-24 py-32 md:px-32 md:py-64">{form}</div>
        </div>
      </div>
    </Dialog>,
    document.body
  );
}
