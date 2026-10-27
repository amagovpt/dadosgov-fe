export interface PendingResourceMeta {
  title: string;
  resourceType: string;
  description: string;
  filesize?: string;
  format?: string;
  mime?: string;
}

export interface ResourceUploadFeedback {
  source: "url" | "file";
  variant: "success" | "danger";
  message: string;
}

export interface FileUploadModalProps {
  feedback?: ResourceUploadFeedback | null;
  onClearFeedback?: () => void;
  saveMode?: "pending" | "immediate" | "editor";
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
