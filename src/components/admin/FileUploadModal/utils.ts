
export function getFileExtension(name: string, isUrl: boolean): string {
  const extMatch = !isUrl ? name.match(/(\.[^.]+)$/) : null;
  return extMatch ? extMatch[1] : "";
}

export function formatFileSize(bytes: number): string {
  const sizeKB = (bytes / 1024).toFixed(1);
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${sizeKB} KB`;
}
