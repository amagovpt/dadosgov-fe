/**
 * Standardised user-facing message for security rejections coming from the
 * backend's `validate_upload` / `validate_image_stream` (poisoned files,
 * scripts embedded in images, XXE in XML, HTML disguised as image, etc.).
 *
 * The backend returns verbose technical strings that mention scan internals
 * (e.g. "Upload rejected: 'foo.xml' (type: text/xml) contains dangerous
 * content: embedded script tag (<script>). ..."). Replace them with a
 * consistent PT-pt warning matching the client-side block message.
 */
export const POISONED_FILE_WARNING =
  "O ficheiro contém código malicioso ou scripts não autorizados que comprometem a segurança do sistema.";

const SECURITY_REJECTION_MARKERS = [
  "upload rejected",
  "carregamento rejeitado",
  "dangerous content",
  "dangerous embedded content",
  "conteúdo perigoso",
  "conteudo perigoso",
];

export function translateUploadError(message: string | null | undefined): string {
  if (!message) return "";
  const lower = message.toLowerCase();
  if (SECURITY_REJECTION_MARKERS.some((marker) => lower.includes(marker))) {
    return POISONED_FILE_WARNING;
  }
  return message;
}
