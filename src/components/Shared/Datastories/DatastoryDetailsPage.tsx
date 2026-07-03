"use client";

import { Datastory as DatastoryType } from "@/service/types/datastories/datastory";
import { Datastory } from ".";
import { ModalProvider } from "@ama-pt/agora-design-system";

export type DatastoryDetailsPageProps = {
  datastory: DatastoryType;
};

export default function DatastoryDetailsPage({
  datastory,
}: DatastoryDetailsPageProps) {
  return (
    <ModalProvider>
      <main className="flex flex-col datastory-page">
        {/* hero section with index */}
        <Datastory.Hero {...datastory.hero} />

        {/* this component will render the sections dynamically, acording with each schemaName */}
        <Datastory.Sections {...datastory.sections} />
      </main>
    </ModalProvider>
  );
}
