"use client";

import { createContext, useContext, Suspense, use, useState, useRef, useSyncExternalStore, type ReactNode } from "react";
import { Button } from "@ama-pt/agora-design-system";
import { ExpandableDescription } from "@/components/Shared/ExpandableDescription";
import { DataserviceSwagger } from "./DataserviceSwagger";
import type { ParsedSwagger } from "@/utils/parseOpenApi";

export { Icon, Pill } from "@ama-pt/agora-design-system";

const SwaggerContext = createContext<{ open: boolean; setOpen: (open: boolean) => void }>({ open: false, setOpen: () => {} });
const subscribeHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export function SwaggerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <SwaggerContext.Provider value={{ open, setOpen }}>{children}</SwaggerContext.Provider>;
}

export function SwaggerShortcut({ children }: { children: ReactNode }) {
  const { setOpen } = useContext(SwaggerContext);
  const hydrated = useSyncExternalStore(subscribeHydration, clientReady, serverReady);
  return (
    <Button appearance="outline" variant="neutral" hasIcon trailingIcon="agora-line-chevron-down"
      trailingIconHover="agora-solid-chevron-down" disabled={!hydrated}
      onClick={() => {
        setOpen(true);
        document.getElementById("swagger")?.scrollIntoView({ behavior: "smooth" });
      }}>
      {children}
    </Button>
  );
}

function StreamedSwagger({ promise, machineDocumentationUrl }: {
  promise: Promise<ParsedSwagger | null>;
  machineDocumentationUrl: string;
}) {
  const { open, setOpen } = useContext(SwaggerContext);
  return <DataserviceSwagger swagger={use(promise)} machineDocumentationUrl={machineDocumentationUrl} open={open} onOpenChange={setOpen} />;
}

export function SwaggerPanel(props: { promise: Promise<ParsedSwagger | null>; machineDocumentationUrl: string }) {
  const { open, setOpen } = useContext(SwaggerContext);
  return (
    <Suspense fallback={<DataserviceSwagger swagger={null} loading machineDocumentationUrl={props.machineDocumentationUrl} open={open} onOpenChange={setOpen} />}>
      <StreamedSwagger {...props} />
    </Suspense>
  );
}

export function ExternalDocumentationButton({ href, ...props }: React.ComponentProps<typeof Button> & { href: string }) {
  return <Button {...props} onClick={() => window.open(href, "_blank", "noopener,noreferrer")} />;
}

export function DataserviceColumns({ title, description, sidebar }: {
  title: ReactNode;
  description: ReactNode;
  sidebar: ReactNode;
}) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  return (
    <div className="container grid gap-32 xl:grid-cols-12">
      <div className="xl:col-span-6 xl:block">
        <div className="flex flex-col gap-4" ref={titleRef}>{title}</div>
        <ExpandableDescription sidebarRef={sidebarRef} titleRef={titleRef}>{description}</ExpandableDescription>
      </div>
      <div className="xl:col-span-6">
        <div className="flex h-fit flex-col" ref={sidebarRef}>{sidebar}</div>
      </div>
    </div>
  );
}
