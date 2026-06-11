"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { DropdownSection, DropdownOption } from "@ama-pt/agora-design-system";
import IsolatedSelect from "./IsolatedSelect";
import { suggestOrganizations } from "@/service/api/organizations";
import { suggestUsers } from "@/service/api/search";
import type { OrganizationSuggestion, UserSuggestion } from "@/service/types/identity";
import type { TransferRecipientClass } from "@/service/types/transfer-system";

export interface RecipientSelection {
  class: TransferRecipientClass;
  id: string;
  label: string;
}

interface RecipientSelectProps {
  id: string;
  placeholder: string;
  onChange: (selection: RecipientSelection | null) => void;
  hasError?: boolean;
  errorFeedbackText?: string;
}

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 10;

export default function RecipientSelect({
  id,
  placeholder,
  onChange,
  hasError,
  errorFeedbackText,
}: RecipientSelectProps) {
  const [users, setUsers] = useState<UserSuggestion[]>([]);
  const [orgs, setOrgs] = useState<OrganizationSuggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const valueRef = useRef("");
  // Index from "Class:id" key to the full RecipientSelection so the parent
  // can be notified with the resolved label without re-fetching the entity.
  const indexRef = useRef<Map<string, RecipientSelection>>(new Map());

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      setUsers([]);
      setOrgs([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const [u, o] = await Promise.all([
          suggestUsers(q, MAX_RESULTS),
          suggestOrganizations(q, MAX_RESULTS),
        ]);
        setUsers(u);
        setOrgs(o);
      } catch {
        setUsers([]);
        setOrgs([]);
      } finally {
        setIsSearching(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const next = new Map<string, RecipientSelection>();
    users.forEach((u) =>
      next.set(`User:${u.id}`, {
        class: "User",
        id: u.id,
        label: `${u.first_name} ${u.last_name}`.trim(),
      })
    );
    orgs.forEach((o) =>
      next.set(`Organization:${o.id}`, {
        class: "Organization",
        id: o.id,
        label: o.name,
      })
    );
    indexRef.current = next;
  }, [users, orgs]);

  const handleChange = (value: string) => {
    if (!value) {
      onChange(null);
      return;
    }
    onChange(indexRef.current.get(value) ?? null);
  };

  const noResultsText = useMemo(() => {
    if (searchQuery.trim().length < MIN_QUERY_LENGTH) {
      return "Escreva pelo menos 2 caracteres para procurar...";
    }
    if (isSearching) return "A pesquisar...";
    return "Nenhum utilizador ou organização encontrado";
  }, [searchQuery, isSearching]);

  return (
    <IsolatedSelect
      label=""
      hideLabel
      placeholder={placeholder}
      id={id}
      onChangeRef={valueRef}
      searchable
      searchInputPlaceholder="Escreva para procurar..."
      searchNoResultsText={noResultsText}
      hasError={hasError}
      errorFeedbackText={errorFeedbackText}
      onChangeCallback={handleChange}
      onSearchCallback={setSearchQuery}
    >
      <DropdownSection name="Utilizadores">
        {users.map((u) => (
          <DropdownOption key={`user-${u.id}`} value={`User:${u.id}`}>
            {`${u.first_name} ${u.last_name}`.trim()}
          </DropdownOption>
        ))}
      </DropdownSection>
      <DropdownSection name="Organizações">
        {orgs.map((o) => (
          <DropdownOption key={`org-${o.id}`} value={`Organization:${o.id}`}>
            {o.name}
          </DropdownOption>
        ))}
      </DropdownSection>
    </IsolatedSelect>
  );
}
