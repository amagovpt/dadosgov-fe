export function getAdminStepTitle(step: unknown): string {
  if (typeof step === "string") return step;

  if (step && typeof step === "object" && "title" in step) {
    const title = (step as { title?: unknown }).title;
    return typeof title === "string" ? title : "";
  }

  return "";
}
