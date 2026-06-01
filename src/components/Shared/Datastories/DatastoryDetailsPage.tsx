import { Datastory as DatastoryType } from "@/types/datastories/datastory";
import { Datastory } from ".";
import { BreadcrumbItem } from "@/service/types/shared/breadcrumbItem";

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
      {/* hero section with index */}
      <Datastory.Hero {...datastory.hero} breadcrumbs={breadcrumbItems} />

      {/* this component will render the sections dynamically, acording with each schemaName */}
      <Datastory.Sections {...datastory.sections} />
    </main>
  );
}
