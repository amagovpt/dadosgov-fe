import { SearchBenProjStoreContext } from "@/providers/SearchBenProjProvider";
import { type SearchBenProjStore as SearchBenProjStorePT2030 } from "@/store/searchBenProj-store";
import { useContext } from "react";
import { useStore } from "zustand";

type SearchBenProjStore = SearchBenProjStorePT2030;

export const useSearchBenProjStore = <T>(selector: (store: SearchBenProjStore) => T): T => {
  const searchBenProjStoreContext = useContext(SearchBenProjStoreContext);
  const activeContext = searchBenProjStoreContext;

  if (!activeContext) {
    throw new Error(
      "useSearchBenProjStore must be used within SearchBenProjStoreProvider or SearchBenProjPRRStoreProvider"
    );
  }

  return useStore(activeContext, selector);
};
