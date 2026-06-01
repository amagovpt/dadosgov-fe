import { DatastorySections as DatastorySectionsType } from "@/types/datastories/datastory";
import BigNumbers from "./Sections/BigNumbers";
import Iframe from "./Sections/Iframe";
import Sources from "./Sections/Sources";

type SectionBg = "white" | "primary";

export type DatastorySectionsI = DatastorySectionsType;

export default function DatastorySections({ isFirstSectionWhite, sections }: DatastorySectionsI) {
  const getBg = (startWith: SectionBg) => {
    return startWith === "white" ? "bg-white" : "bg-primary-100";
  };

  const getSectionClassname = (index: number) => {
    let sectionClassname = "";
    const startWith: SectionBg = isFirstSectionWhite === true ? "white" : "primary";
    if (startWith) {
      const isEven = index % 2 === 0;
      sectionClassname = getBg(isEven ? startWith : startWith === "white" ? "primary" : "white");
    }
    return sectionClassname;
  };

  return sections?.map((section, index) => {
    switch (section.schemaName) {
      case "section-datastory-bignumbers":
        return (
          <BigNumbers
            key={`section-${index}`}
            {...section}
            className={getSectionClassname(index)}
          />
        );
      case "section-datastory-iframe":
        return (
          <Iframe key={`section-${index}`} {...section} className={getSectionClassname(index)} />
        );
      case "datasource":
        return <Sources key={`section-${index}`} {...section} />;
      default:
        return null;
    }
  });
}
