import { ReactNode } from "react";

export interface ISearchBenProjRootContainer {
  children: ReactNode;
}

export default function SearchBenProjRootContainer({ children }: ISearchBenProjRootContainer) {
  return (
    <div className="w-full grid grid-cols-12 gap-32">
      {children}
    </div>
  );
}
