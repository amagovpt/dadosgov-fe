"use client";

import type React from "react";
import { createContactPoint } from "@/service/api/organizations";
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
  function toggleExistingContact(id: string) {
    setSelectedContactPointIds((previousIds) =>
      previousIds.includes(id)
        ? previousIds.filter((currentId) => currentId !== id)
        : [...previousIds, id],
    );
  }

  function updateDraftContactField(draftId: number, field: string, value: string) {
    setDraftContacts((previousDrafts) =>
      previousDrafts.map((draft) =>
        draft.id === draftId
          ? { ...draft, [field]: value, errors: { ...draft.errors, [field]: false } }
          : draft,
      ),
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
          currentDraft.id === draftId ? { ...currentDraft, errors } : currentDraft,
        ),
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
        previousDrafts.filter((currentDraft) => currentDraft.id !== draftId),
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
    handleAddDraftContactRow,
    handleSaveContactDraft,
    toggleExistingContact,
    updateDraftContactField,
  };
}
