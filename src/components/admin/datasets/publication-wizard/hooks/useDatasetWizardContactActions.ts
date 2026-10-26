"use client";

import type React from "react";
import { useEffect } from "react";
import {
  createContactPoint,
  deleteContactPoint,
  fetchOrgContactPoints,
} from "@/service/api/organizations";
import type { ContactPoint } from "@/service/types/dataset";
import type { DatasetWizardDraftContact } from "@/components/admin/datasets/publication-wizard/datasetWizardTypes";

interface UseDatasetWizardContactActionsParams {
  selectedProducer: string;
  draftIdRef: React.MutableRefObject<number>;
  draftContacts: DatasetWizardDraftContact[];
  setOrgContactPoints: React.Dispatch<React.SetStateAction<ContactPoint[]>>;
  setSelectedContactPointIds: React.Dispatch<React.SetStateAction<string[]>>;
  setDraftContacts: React.Dispatch<React.SetStateAction<DatasetWizardDraftContact[]>>;
}

export function useDatasetWizardContactActions({
  selectedProducer,
  draftIdRef,
  draftContacts,
  setOrgContactPoints,
  setSelectedContactPointIds,
  setDraftContacts,
}: UseDatasetWizardContactActionsParams) {
  // Ignore a previous producer's response after switching organizations.
  useEffect(() => {
    if (!selectedProducer || selectedProducer === "user") return;
    let cancelled = false;
    async function loadContactPoints() {
      const response = await fetchOrgContactPoints(selectedProducer);
      if (cancelled) return;
      setOrgContactPoints((previous) => {
        const contacts = new Map(response.data.map((contact) => [contact.id, contact]));
        // Keep contacts saved while the producer's initial request was in flight.
        previous.forEach((contact) => contacts.set(contact.id, contact));
        return [...contacts.values()];
      });
      if (response.data.length > 0) setDraftContacts([]);
    }
    void loadContactPoints();
    return () => {
      cancelled = true;
    };
  }, [selectedProducer, setDraftContacts, setOrgContactPoints]);

  const handleContactSaved = (contact: ContactPoint, isNew: boolean) => {
    setOrgContactPoints((previous) => {
      const index = previous.findIndex((item) => item.id === contact.id);
      return index < 0
        ? [...previous, contact]
        : previous.map((item) => (item.id === contact.id ? contact : item));
    });
    if (isNew)
      setSelectedContactPointIds((previous) =>
        previous.includes(contact.id) ? previous : [...previous, contact.id]
      );
  };

  const handleRemoveContact = async (id: string) => {
    await deleteContactPoint(id);
    setOrgContactPoints((previous) => previous.filter((contact) => contact.id !== id));
    setSelectedContactPointIds((previous) => previous.filter((contactId) => contactId !== id));
  };

  function toggleExistingContact(id: string) {
    setSelectedContactPointIds((previousIds) =>
      previousIds.includes(id)
        ? previousIds.filter((currentId) => currentId !== id)
        : [...previousIds, id]
    );
  }

  function updateDraftContactField(draftId: number, field: string, value: string) {
    setDraftContacts((previousDrafts) =>
      previousDrafts.map((draft) =>
        draft.id === draftId
          ? { ...draft, [field]: value, errors: { ...draft.errors, [field]: false } }
          : draft
      )
    );
  }

  async function handleSaveContactDraft(draftId: number) {
    const draft = draftContacts.find((currentDraft) => currentDraft.id === draftId);
    if (!draft) return;

    const errors: Record<string, boolean> = {};
    if (!draft.name.trim()) errors.name = true;
    if (!draft.email.trim() && !draft.link.trim()) {
      errors.email = true;
      errors.link = true;
    }

    if (Object.keys(errors).length > 0) {
      setDraftContacts((previousDrafts) =>
        previousDrafts.map((currentDraft) =>
          currentDraft.id === draftId ? { ...currentDraft, errors } : currentDraft
        )
      );
      requestAnimationFrame(() => {
        document
          .querySelector('[aria-invalid="true"]')
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      const payload: Parameters<typeof createContactPoint>[0] = {
        name: draft.name.trim(),
        role: "contact",
        organization: selectedProducer,
      };

      if (draft.email.trim()) payload.email = draft.email.trim();
      if (draft.link.trim()) payload.contact_form = draft.link.trim();

      const newContact = await createContactPoint(payload);
      setOrgContactPoints((previousContactPoints) => [...previousContactPoints, newContact]);
      setSelectedContactPointIds((previousIds) => [...previousIds, newContact.id]);
      setDraftContacts((previousDrafts) =>
        previousDrafts.filter((currentDraft) => currentDraft.id !== draftId)
      );
    } catch (error) {
      console.error("Error creating contact point:", error);
    }
  }

  function handleAddDraftContactRow() {
    draftIdRef.current += 1;
    setDraftContacts((previousDrafts) => [
      ...previousDrafts,
      {
        id: draftIdRef.current,
        name: "",
        email: "",
        link: "",
        saved: false,
        errors: {},
      },
    ]);
  }

  return {
    handleContactSaved,
    handleRemoveContact,
    handleAddDraftContactRow,
    handleSaveContactDraft,
    toggleExistingContact,
    updateDraftContactField,
  };
}
