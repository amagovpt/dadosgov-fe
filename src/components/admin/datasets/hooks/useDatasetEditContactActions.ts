"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { deleteContactPoint, fetchOrgContactPoints } from "@/service/api/organizations";
import type { ContactPoint } from "@/service/types/dataset";

interface UseDatasetEditContactActionsParams {
  datasetId: string;
  producerId: string;
  setContacts: Dispatch<SetStateAction<ContactPoint[]>>;
  setSelectedIds: Dispatch<SetStateAction<string[]>>;
}

export function useDatasetEditContactActions({
  datasetId,
  producerId,
  setContacts,
  setSelectedIds,
}: UseDatasetEditContactActionsParams) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    if (!producerId) return;
    let cancelled = false;

    async function loadContacts() {
      setIsLoading(true);
      setLoadError(false);
      try {
        const response = await fetchOrgContactPoints(producerId, 1, 100, { throwOnError: true });
        if (cancelled) return;
        setContacts((previous) => {
          const contacts = new Map(response.data.map((contact) => [contact.id, contact]));
          // Preserve assigned contacts and contacts edited while the list was loading.
          previous.forEach((contact) => contacts.set(contact.id, contact));
          return [...contacts.values()];
        });
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadContacts();
    return () => {
      cancelled = true;
    };
  }, [datasetId, producerId, loadAttempt, setContacts]);

  function handleContactSaved(contact: ContactPoint, isNew: boolean) {
    setContacts((previous) =>
      previous.some((item) => item.id === contact.id)
        ? previous.map((item) => (item.id === contact.id ? contact : item))
        : [...previous, contact]
    );
    if (isNew) {
      setSelectedIds((previous) =>
        previous.includes(contact.id) ? previous : [...previous, contact.id]
      );
    }
  }

  async function handleRemoveContact(id: string) {
    await deleteContactPoint(id);
    setContacts((previous) => previous.filter((contact) => contact.id !== id));
    setSelectedIds((previous) => previous.filter((contactId) => contactId !== id));
  }

  function toggleContact(id: string) {
    setSelectedIds((previous) =>
      previous.includes(id) ? previous.filter((contactId) => contactId !== id) : [...previous, id]
    );
  }

  return {
    isLoading,
    loadError,
    retry: () => setLoadAttempt((previous) => previous + 1),
    handleContactSaved,
    handleRemoveContact,
    toggleContact,
  };
}
