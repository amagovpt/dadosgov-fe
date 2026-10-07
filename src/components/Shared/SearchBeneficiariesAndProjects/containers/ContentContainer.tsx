import { ReactNode } from "react";

export interface ISearchBenProjContentContainer {
  children: ReactNode;
}

export default function SearchBenProjContentContainer({
  children,
}: ISearchBenProjContentContainer) {
  return (
    <div className="col-span-12 xl:col-span-8 py-32 xl:pt-8 xl:pb-128 flex flex-col gap-32 xl:gap-0">
      {children}
    </div>
  );
}
