"use client"
import { ReactNode } from "react";
import {
  ModalProvider,
} from "@ama-pt/agora-design-system";

export default function ModalRoot({ children }: { children: ReactNode }) {
  return <ModalProvider>{children}</ModalProvider>;
}
