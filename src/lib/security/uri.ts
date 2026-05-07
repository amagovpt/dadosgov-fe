const DANGEROUS_URI_PATTERNS = [
  /^\s*(javascript|vbscript|data):/i,
  /^\s*&#/i,
  /^\s*%[0-9a-f]{2}/i,
];

const DANGEROUS_PROTOCOLS = ["javascript:", "vbscript:", "data:"];

export function normalizeUri(uri: string): string {
  if (!uri) return "";

  const stripped = uri.trim().replace(/[\n\r\t]/g, "");

  try {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = stripped;
    return textarea.value;
  } catch {
    return stripped;
  }
}

export function isDangerousUri(uri: string): boolean {
  const normalized = normalizeUri(uri);

  for (const pattern of DANGEROUS_URI_PATTERNS) {
    if (pattern.test(normalized)) return true;
  }

  const lower = normalized.toLowerCase();
  return DANGEROUS_PROTOCOLS.some((proto) => lower.includes(proto));
}
