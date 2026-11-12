"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
  label?: string;
  required?: boolean;
  placeholder: string;
  value?: RecipientSelection | null;
  onChange: (selection: RecipientSelection | null) => void;
  hasError?: boolean;
  errorFeedbackText?: string;
  helperText?: string;
}

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 10;

export default function RecipientSelect({
  id,
  label,
  required,
  placeholder,
  value,
  onChange,
  hasError,
  errorFeedbackText,
  helperText,
}: RecipientSelectProps) {
  const { t } = useTranslation("admin-common");
  const [users, setUsers] = useState<UserSuggestion[]>([]);
  const [orgs, setOrgs] = useState<OrganizationSuggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const valueRef = useRef("");

  useEffect(() => {
    const q = searchQuery.trim();
    let cancelled = false;
    let frameId: number | null = null;

    if (q.length < MIN_QUERY_LENGTH) {
      frameId = requestAnimationFrame(() => {
        setUsers([]);
        setOrgs([]);
        setIsSearching(false);
      });
      return () => {
        if (frameId !== null) cancelAnimationFrame(frameId);
      };
    }

    frameId = requestAnimationFrame(() => {
      setIsSearching(true);
    });

    const timer = setTimeout(async () => {
      try {
        const [u, o] = await Promise.all([
          suggestUsers(q, MAX_RESULTS),
          suggestOrganizations(q, MAX_RESULTS),
        ]);
        if (!cancelled) {
          setUsers(u);
          setOrgs(o);
        }
      } catch {
        if (!cancelled) {
          setUsers([]);
          setOrgs([]);
        }
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      if (frameId !== null) cancelAnimationFrame(frameId);
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Keep a controlled selection available when the search results change.
  const selectionIndex = useMemo(() => {
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
    if (value) next.set(`${value.class}:${value.id}`, value);
    return next;
  }, [users, orgs, value]);
  const selections = Array.from(selectionIndex.values());

  const handleChange = (value: string) => {
    if (!value) {
      onChange(null);
      return;
    }
    onChange(selectionIndex.get(value) ?? null);
  };

  const noResultsText = useMemo(() => {
    if (searchQuery.trim().length < MIN_QUERY_LENGTH) {
      return t("recipient.minChars", { count: MIN_QUERY_LENGTH });
    }
    if (isSearching) return t("recipient.searching");
    return t("recipient.noResults");
  }, [isSearching, searchQuery, t]);

  return (
    <IsolatedSelect
      label={label || ""}
      hideLabel={!label}
      required={required}
      placeholder={placeholder}
      id={id}
      onChangeRef={valueRef}
      defaultValue={value === undefined ? undefined : value ? `${value.class}:${value.id}` : ""}
      searchable
      searchInputPlaceholder={t("recipient.searchPlaceholder")}
      searchNoResultsText={noResultsText}
      hasError={hasError}
      errorFeedbackText={errorFeedbackText}
      helperText={helperText}
      onChangeCallback={handleChange}
      onSearchCallback={setSearchQuery}
    >
      <DropdownSection name={t("recipient.usersSection")}>
        {selections
          .filter((selection) => selection.class === "User")
          .map((selection) => (
            <DropdownOption key={`user-${selection.id}`} value={`User:${selection.id}`}>
              {selection.label}
            </DropdownOption>
          ))}
      </DropdownSection>
      <DropdownSection name={t("recipient.organizationsSection")}>
        {selections
          .filter((selection) => selection.class === "Organization")
          .map((selection) => (
            <DropdownOption key={`org-${selection.id}`} value={`Organization:${selection.id}`}>
              {selection.label}
            </DropdownOption>
          ))}
      </DropdownSection>
    </IsolatedSelect>
  );
}
