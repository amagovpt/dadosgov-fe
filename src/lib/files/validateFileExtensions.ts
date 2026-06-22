interface FileExtensionValidationResult {
  valid: File[];
  invalid: string[];
}

export function validateFileExtensions(
  files: File[],
  allowedExtensions: string[] | null | undefined,
): FileExtensionValidationResult {
  if (!allowedExtensions || allowedExtensions.length === 0) {
    return { valid: files, invalid: [] };
  }

  const allowed = new Set(allowedExtensions.map((extension) => extension.toLowerCase()));
  const valid: File[] = [];
  const invalid: string[] = [];

  for (const file of files) {
    const extension = file.name.includes(".")
      ? file.name.split(".").pop()!.toLowerCase()
      : "";

    if (!extension || !allowed.has(extension)) invalid.push(file.name);
    else valid.push(file);
  }

  return { valid, invalid };
}
