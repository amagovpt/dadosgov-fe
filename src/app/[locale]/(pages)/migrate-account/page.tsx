import { Suspense } from "react";
import MigrateAccountClient from "@/components/login/MigrateAccountClient";

export default function MigrateAccountPage() {
  return (
    <Suspense>
      <MigrateAccountClient />
    </Suspense>
  );
}
