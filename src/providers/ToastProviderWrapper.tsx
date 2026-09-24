"use client";

import { ToastProvider } from "@ama-pt/agora-design-system";
import { ReactNode } from "react";

/**
 * Mounts the design system's toast stack app-wide, the same way
 * `PopupProviderWrapper` mounts its dialogs.
 *
 * The toast list is rendered inline as a sibling of `children` (it is not
 * portalled), so this has to sit high in the tree for the fixed-position
 * styling to place it against the viewport.
 */
export function ToastProviderWrapper({ children }: { children: ReactNode }) {
  return <ToastProvider position="bottom-right">{children}</ToastProvider>;
}
