import { Datastory as DatastoryType } from "@/types/datastories/datastory";
import { BreadcrumbItem } from "@/types/shared";
import { Datastory } from ".";

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
      <Datastory.Hero {...datastory.hero} breadcrumbs={breadcrumbItems}/>

      {datastory.sections.map((section, index) => (
        <Datastory.Section {...section} key={`section-${index}-${section.id}`} />
      ))}

      <Datastory.Sources {...datastory.dataSource} />
    </main>
  );
}
