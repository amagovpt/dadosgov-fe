"use client";

import { useRef, useState } from "react";
import {
  PendingResourceEditorDialog,
  type PendingResourceEditorDialogProps,
} from "./PendingResourceEditorDialog";

type EditorRequest = Omit<PendingResourceEditorDialogProps, "onClose" | "sessionKey">;
type EditorSession = EditorRequest & { sessionKey: number };

export function usePendingResourceEditor() {
  const [sessions, setSessions] = useState<EditorSession[]>([]);
  const session = useRef(0);
  const trigger = useRef<HTMLElement | null>(null);
  const current = sessions[0];

  function closeCurrent() {
    setSessions((previous) => previous.slice(1));
    if (sessions.length === 1) requestAnimationFrame(() => trigger.current?.focus());
  }

  return {
    openEditors: (requests: EditorRequest[]) => {
      if (!requests.length) return;
      if (!sessions.length) trigger.current = document.activeElement as HTMLElement;
      const added = requests.map((request) => ({ ...request, sessionKey: ++session.current }));
      setSessions((previous) => [...previous, ...added]);
    },
    editor: current ? (
      <PendingResourceEditorDialog key={current.sessionKey} {...current} onClose={closeCurrent} />
    ) : null,
  };
}
