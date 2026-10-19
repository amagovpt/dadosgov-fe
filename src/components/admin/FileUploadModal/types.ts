export interface PendingResourceMeta {
  title: string;
  resourceType: string;
  description: string;
  filesize?: string;
  format?: string;
  mime?: string;
}

export interface FileUploadModalProps {
  saveMode?: "pending" | "immediate";
  inputId?: string;
  disabled?: boolean;
  appearance?: "default" | "wizard";
  uploadedFiles: File[];
  resourceUrls: string[];
  onFilesChange: (files: File[]) => void | Promise<void>;
  onUrlAdd: (url: string) => void | Promise<void>;
  hasError?: boolean;
  allowedExtensions?: string[] | null;
}

export interface PendingResourceItem {
  key: string;
  name: string;
  size?: string;
  isUrl: boolean;
  index: number;
  file?: File;
}
