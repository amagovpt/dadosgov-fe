"use client";

import {
  createSearchBenProjStore,
} from "@/store/searchBenProj-store";
import { type ReactNode, createContext, useState } from "react";

export type SearchBenProjStoreApi = ReturnType<typeof createSearchBenProjStore>;

export const SearchBenProjStoreContext = createContext<
  SearchBenProjStoreApi | undefined
>(undefined);

export interface SearchBenProjStoreProviderProps {
  children: ReactNode;
  subject?: "beneficiaries" | "projects";
  apiRoute: string;
}

export const SearchBenProjStoreProvider = ({
  children,
  subject = "beneficiaries",
  apiRoute,
}: SearchBenProjStoreProviderProps) => {
  const [store] = useState(() => createSearchBenProjStore(subject, apiRoute));

  return (
    <SearchBenProjStoreContext.Provider value={store}>
      {children}
    </SearchBenProjStoreContext.Provider>
  );
};
