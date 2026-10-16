"use client";

import { Button, Icon, Switch, useModalContext } from "@ama-pt/agora-design-system";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import type { ContactPoint } from "@/service/types/dataset";
import { DatasetContactModal } from "./DatasetContactModal";

interface DatasetWizardContactsProps {
  producerId: string;
  contacts: ContactPoint[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSaved: (contact: ContactPoint, isNew: boolean) => void;
  onRemove: (id: string) => void;
}

export function DatasetWizardContacts({
  producerId,
  contacts,
  selectedIds,
  onToggle,
  onSaved,
  onRemove,
}: DatasetWizardContactsProps) {
  const { t } = useTranslation(["admin-datasets", "datasets"]);
  const { show } = useModalContext();
  const modalSession = useRef(0);
  const isOrganization = !!producerId && producerId !== "user";

  function openModal(trigger: HTMLButtonElement, contact?: ContactPoint) {
    modalSession.current += 1;
    show(
      <DatasetContactModal
        key={modalSession.current}
        producerId={producerId}
        contact={contact}
        onSaved={(saved) => onSaved(saved, !contact)}
      />,
      {
        closeButtonLabel: t("admin-datasets:edit.closeAriaLabel"),
        darkMode: false,
        // Keep Agora's modal and focus handling; adjust only its design-specific dimensions.
        className: [
          "bg-white! text-neutral-900 overflow-y-auto",
          "[&_.agora-modal-dialog]:mx-auto [&_.agora-modal-dialog]:h-auto! [&_.agora-modal-dialog]:min-h-full [&_.agora-modal-dialog]:max-w-[1440px]",
          "[&_.agora-modal-dialog-header]:h-[76px]! [&_.agora-modal-dialog-header]:px-16 [&_.agora-modal-dialog-header]:pt-16 [&_.agora-modal-dialog-header>button]:m-0!",
          "[&_.agora-modal-dialog-body]:mb-0! [&_.agora-modal-dialog-body]:max-h-none! [&_.agora-modal-dialog-body]:overflow-visible! [&_.agora-modal-dialog-body]:px-24! [&_.agora-modal-dialog-body]:py-32! md:[&_.agora-modal-dialog-body]:px-32! md:[&_.agora-modal-dialog-body]:py-64!",
          "[&_.agora-modal-dialog-body-content]:mx-auto [&_.agora-modal-dialog-body-content]:max-h-none! [&_.agora-modal-dialog-body-content]:w-full [&_.agora-modal-dialog-body-content]:max-w-[1008px]! [&_.agora-modal-dialog-body-content]:overflow-visible! [&_.agora-modal-dialog-body-content]:p-0!",
          "[&_.agora-btn]:min-h-60! [&_.agora-btn]:py-[14px] [&_.input-label-wrapper]:mb-8",
        ].join(" "),
        "aria-label": t(
          contact ? "admin-datasets:contacts.edit" : "admin-datasets:form.addContactAction"
        ),
        onHide: () => trigger.focus(),
      }
    );
  }

  return (
    <div className="flex w-full flex-col items-start gap-16">
      <h3 className="text-m-medium text-primary-900">{t("admin-datasets:contacts.assignments")}</h3>
      {isOrganization &&
        contacts.map((contact) => (
          <article
            key={contact.id}
            className="flex w-full flex-col gap-16 rounded-4 bg-primary-100 p-24 text-m-regular text-neutral-900 md:p-32"
            aria-label={contact.name}
          >
            <div className="flex flex-wrap items-center gap-16 md:flex-nowrap">
              <span className="flex shrink-0 items-center justify-center rounded-full border-2 border-primary-300 p-16">
                <Icon name="agora-line-user" />
              </span>
              <h4 className="min-w-0 flex-1 text-m-bold wrap-anywhere">{contact.name}</h4>
              <Switch
                id={`dataset-contact-active-${contact.id}`}
                label={t("admin-datasets:contacts.active")}
                aria-label={`${t("admin-datasets:contacts.active")}: ${contact.name}`}
                checked={selectedIds.includes(contact.id)}
                onChange={() => onToggle(contact.id)}
              />
            </div>
            <dl className="grid grid-cols-1 gap-x-16 gap-y-32 md:grid-cols-2">
              <div className="border-b border-neutral-700 pb-16 text-m-regular [&_dd]:wrap-anywhere [&_dt]:py-8 [&_dt]:text-m-medium [&_dt]:text-primary-900">
                <dt>Email</dt>
                <dd>{contact.email || "—"}</dd>
              </div>
              <div className="border-b border-neutral-700 pb-16 text-m-regular [&_dd]:wrap-anywhere [&_dt]:py-8 [&_dt]:text-m-medium [&_dt]:text-primary-900">
                <dt>{t("admin-datasets:contacts.role")}</dt>
                <dd>
                  {t(`datasets:contactRoles.${contact.role}`, { defaultValue: contact.role })}
                </dd>
              </div>
              <div className="col-span-full border-b border-neutral-700 pb-16 text-m-regular [&_dd]:wrap-anywhere [&_dt]:py-8 [&_dt]:text-m-medium [&_dt]:text-primary-900">
                <dt>Website</dt>
                <dd>{contact.contact_form || "—"}</dd>
              </div>
            </dl>
            <div className="mt-16 flex flex-wrap justify-between gap-16 md:flex-nowrap [&>button]:w-auto [&>button]:max-w-full md:[&>button]:w-[296px] md:[&>button]:max-w-[calc(50%_-_8px)]">
              <Button
                type="button"
                appearance="link"
                variant="primary"
                hasIcon
                leadingIcon="agora-line-edit"
                onClick={(event) => openModal(event.currentTarget, contact)}
              >
                {t("admin-datasets:contacts.edit")}
              </Button>
              <Button
                type="button"
                appearance="link"
                variant="danger"
                hasIcon
                leadingIcon="agora-line-trash"
                onClick={() => onRemove(contact.id)}
              >
                {t("admin-datasets:contacts.remove")}
              </Button>
            </div>
          </article>
        ))}
      <Button
        type="button"
        appearance="outline"
        variant="primary"
        hasIcon
        trailingIcon="agora-line-plus-circle"
        disabled={!isOrganization}
        onClick={(event) => openModal(event.currentTarget)}
      >
        {t("admin-datasets:form.addContactAction")}
      </Button>
    </div>
  );
}
