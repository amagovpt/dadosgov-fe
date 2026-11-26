import { Suspense } from "react";
import CompleteRegistrationGate from "@/components/login/CompleteRegistrationGate";
import { MigrationInviteGate } from "@/components/login/MigrationInviteGate";
import { adminNamespaces } from "@/config/i18nConfig";
import { RouteTranslations } from "@/providers/RouteTranslations";

export default function AdminGroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  return (
    <RouteTranslations params={params} namespaces={adminNamespaces}>
      <Suspense fallback={null}>
        <CompleteRegistrationGate />
      </Suspense>
      {/* Mounted here too, and that is what reaches the publishers: accounts
          that predate CMD and hold content belong to people who sign in and go
          straight to /admin, and may never load a public page while
          authenticated (LEDG-2527). */}
      <MigrationInviteGate>{children}</MigrationInviteGate>
    </RouteTranslations>
  );
}
