import { Suspense } from "react";
import CompleteRegistrationGate from "@/components/login/CompleteRegistrationGate";

export default function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <CompleteRegistrationGate />
      </Suspense>
      {children}
    </>
  );
}
