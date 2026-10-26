"use client";

import { Button, Icon, Switch } from "@ama-pt/agora-design-system";
import { useState } from "react";
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
  const [modal, setModal] = useState<{
    trigger: HTMLButtonElement;
    contact?: ContactPoint;
  } | null>(null);
  const isOrganization = !!producerId && producerId !== "user";

  function openModal(trigger: HTMLButtonElement, contact?: ContactPoint) {
    setModal({ trigger, contact });
  }

  return (
    <div className="flex w-full flex-col items-start gap-16">
      {modal && (
        <DatasetContactModal
          producerId={producerId}
          contact={modal.contact}
          onSaved={(saved) => onSaved(saved, !modal.contact)}
          onClose={() => {
            setModal(null);
            requestAnimationFrame(() => {
              if (modal.trigger.isConnected) modal.trigger.focus();
            });
          }}
        />
      )}
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
                <dd>{contact.contact_form || "https://"}</dd>
              </div>
            </dl>
            <div className="mt-16 flex flex-wrap justify-between gap-16 md:flex-nowrap [&>button]:w-auto [&>button]:max-w-full md:[&>button]:w-[296px] md:[&>button]:max-w-[calc(50%-8px)]">
              <Button
                type="button"
                appearance="link"
                variant="primary"
                hasIcon
                leadingIcon="agora-line-edit"
                leadingIconHover="agora-solid-edit"
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
                leadingIconHover="agora-solid-trash"
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
        trailingIconHover="agora-solid-plus-circle"
        disabled={!isOrganization}
        onClick={(event) => openModal(event.currentTarget)}
      >
        {t("admin-datasets:form.addContactAction")}
      </Button>
    </div>
  );
}
