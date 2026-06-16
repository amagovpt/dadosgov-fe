"use client";

import { Datastory as DatastoryType } from "@/service/types/datastories/datastory";
import { Datastory } from ".";
import { BreadcrumbItem } from "@/service/types/shared/breadcrumbItem";
import { ModalProvider } from "@ama-pt/agora-design-system";

export type DatastoryDetailsPageProps = {
  breadcrumbItems: BreadcrumbItem[];
  datastory: DatastoryType;
};

export default function DatastoryDetailsPage({
  breadcrumbItems,
  datastory,
}: DatastoryDetailsPageProps) {
  return (
    <ModalProvider>
      <main className="flex flex-col">
        {/* hero section with index */}
        <Datastory.Hero {...datastory.hero} breadcrumbs={breadcrumbItems} />

        {/* this component will render the sections dynamically, acording with each schemaName */}
        <Datastory.Sections {...datastory.sections} />
      </main>
    </ModalProvider>
  );
}
