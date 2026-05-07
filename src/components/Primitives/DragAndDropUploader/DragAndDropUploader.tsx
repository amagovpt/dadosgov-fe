"use client";

import { ChangeEvent, useCallback } from "react";
import {
  DragAndDropUploader as ADSDragAndDropUploader,
  DragAndDropUploaderProps,
} from "@ama-pt/agora-design-system";
import { guardFiles } from "@/lib/security/uploadGuard";

export type SecurityRejection = { file: File; reason: string };

export interface SecureDragAndDropUploaderProps extends DragAndDropUploaderProps {
  onSecurityError?: (rejections: SecurityRejection[]) => void;
}

function buildFileList(files: File[]): FileList {
  const dt = new DataTransfer();
  for (const f of files) dt.items.add(f);
  return dt.files;
}

export default function DragAndDropUploader({
  onChange,
  onSecurityError,
  ...rest
}: SecureDragAndDropUploaderProps) {
  const handleChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.target;
      const files = Array.from(input.files ?? []);

      if (files.length === 0) {
        onChange?.(event);
        return;
      }

      const { accepted, rejected } = await guardFiles(files);

      if (rejected.length > 0) {
        onSecurityError?.(rejected);
      }

      if (accepted.length === 0) {
        try {
          input.value = "";
        } catch {
          /* noop */
        }
        return;
      }

      const cleaned = buildFileList(accepted);
      try {
        input.files = cleaned;
      } catch {
        Object.defineProperty(event.target, "files", {
          value: cleaned,
          configurable: true,
        });
      }

      onChange?.(event);
    },
    [onChange, onSecurityError],
  );

  return <ADSDragAndDropUploader {...rest} onChange={handleChange} />;
}
