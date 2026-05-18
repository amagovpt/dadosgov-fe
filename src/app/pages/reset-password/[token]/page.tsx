import type { Metadata } from "next";
import { ResetPasswordClient } from "@/components/login/ResetPasswordClient";

export const metadata: Metadata = {
  title: "Redefinir palavra-passe - dados.gov.pt",
};

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ResetPasswordClient token={token} />;
}
