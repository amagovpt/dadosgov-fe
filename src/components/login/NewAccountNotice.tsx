"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@ama-pt/agora-design-system";

/**
 * Dismissible banner shown after a CMD (Chave Móvel Digital) login that
 * created a new account (the backend redirect carries cmd_new_account=1).
 * The query parameter is stripped from the URL once the notice is shown.
 */
export default function NewAccountNotice() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Latched on first render so the notice survives the URL cleanup below.
  const [visible, setVisible] = useState(() => searchParams.get("cmd_new_account") === "1");

  useEffect(() => {
    if (searchParams.get("cmd_new_account") !== "1") return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("cmd_new_account");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [searchParams, pathname, router]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="border-green-300 bg-green-50 container mx-auto mt-16 flex max-w-7xl items-start gap-16 rounded-8 border p-16"
    >
      <Icon
        name="agora-line-check-circle"
        className="text-green-600 h-24 w-24 shrink-0"
        aria-hidden
      />
      <div className="flex-grow">
        <p className="text-base-bold text-neutral-900">Nova conta criada</p>
        <p className="text-sm text-neutral-700">
          Foi criada uma nova conta associada à sua Chave Móvel Digital. Pode completar o seu
          perfil na área pessoal.
        </p>
      </div>
      <button
        onClick={() => setVisible(false)}
        aria-label="Fechar aviso"
        className="shrink-0 rounded-4 p-4 text-neutral-700 hover:bg-neutral-100"
      >
        <Icon name="agora-line-close" className="h-20 w-20" aria-hidden />
      </button>
    </div>
  );
}
