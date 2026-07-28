export interface PendingResourceMeta {
  title: string;
  resourceType: string;
  description: string;
  filesize?: string;
  format?: string;
  mime?: string;
}

export interface FileUploadModalProps {
  uploadedFiles: File[];
  resourceUrls: string[];
  onFilesChange: (files: File[]) => void;
  onUrlAdd: (url: string) => void;
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
