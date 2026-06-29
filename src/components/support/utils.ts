export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

export function shouldPreselectFeedbackFromUrl(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("toggle") === "feedback";
}

export function composeMessage(
  description: string,
  category: string,
  toggle: string,
  problemUrl: string,
  problemDateTime: string
): string {
  const lines: string[] = [];
  if (category) lines.push(`Categoria: ${category}`);
  if (toggle === "bug") {
    if (problemUrl.trim()) lines.push(`Página/URL: ${problemUrl.trim()}`);
    if (problemDateTime.trim()) lines.push(`Data/hora aproximada: ${problemDateTime.trim()}`);
  }
  const header = lines.join("\n");
  return header ? `${header}\n\n${description.trim()}` : description.trim();
}
