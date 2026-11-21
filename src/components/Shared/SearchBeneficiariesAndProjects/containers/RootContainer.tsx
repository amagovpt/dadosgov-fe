import { ReactNode } from "react";

// Scroll target used by the pagination to bring the user back to the top of the results
export const SEARCH_BEN_PROJ_ROOT_ID = "search-ben-proj-results";

export interface ISearchBenProjRootContainer {
  children: ReactNode;
}

export default function SearchBenProjRootContainer({ children }: ISearchBenProjRootContainer) {
  return (
    <div id={SEARCH_BEN_PROJ_ROOT_ID} className="w-full grid grid-cols-12 gap-32">
      {children}
    </div>
  );
}
