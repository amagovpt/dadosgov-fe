import { Datastory as DatastoryType } from "@/types/datastories/datastory";
import { BreadcrumbItem } from "@/types/shared";
import { Datastory } from ".";

type SectionBg = "white" | "primary";

export type DatastoryDetailsPageProps = {
  breadcrumbItems: BreadcrumbItem[];
  datastory: DatastoryType;
};

export default function DatastoryDetailsPage({
  breadcrumbItems,
  datastory,
}: DatastoryDetailsPageProps) {
  return (
    <main className="flex flex-col">
      <Datastory.Hero {...datastory.hero} breadcrumbs={breadcrumbItems} />

      <Datastory.Overview {...datastory.sectionOverview} />

      {datastory.sections.map((section, index) => {
        let iframeClassName = "";
        const startWith: SectionBg =
          datastory.sectionOverview && Object.keys(datastory.sectionOverview).length !== 0 ? "primary" : "white";
        if (startWith) {
          const isEven = index % 2 === 0;
          const getBg = (startWith: SectionBg) => {
            return startWith === "white" ? "bg-white" : "bg-primary-100";
          };
          iframeClassName = getBg(isEven ? startWith : startWith === "white" ? "primary" : "white");
        }
        return (
          <Datastory.Iframe
            key={`section-${index}-${section.id}`}
            {...section}
            className={iframeClassName}
          />
        );
      })}

      {/* Related - related datastories */}

      <Datastory.Sources {...datastory.dataSource} />

      {/* Other - other resources */}
    </main>
  );
}
