"use client";

import { Button } from "@ama-pt/agora-design-system";
import type { ReactNode } from "react";

interface FaqLinkProps {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
}

export function FaqLink({ href, onClick, children }: FaqLinkProps) {
  const handleClick = onClick ?? (() => href && window.open(href, "_blank"));

  return (
    <Button
      appearance="link"
      variant="neutral"
      className="inline !p-0 [text-decoration-color:var(--color-neutral-900)]"
      style={{ minHeight: "auto", height: "auto", minWidth: "auto" }}
      onClick={handleClick}
    >
      {children}
    </Button>
  );
}
