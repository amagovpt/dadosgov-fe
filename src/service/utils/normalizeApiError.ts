export interface NormalizedApiError {
  status?: number;
  message: string;
  data?: Record<string, unknown> | null;
  fieldErrors?: Record<string, string>;
}

function stringifyErrorValue(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value.trim() || null;
  if (Array.isArray(value)) {
    const parts = value.map(stringifyErrorValue).filter((part): part is string => Boolean(part));
    return parts.length > 0 ? parts.join(", ") : null;
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function extractFieldErrors(
  data: Record<string, unknown> | null | undefined,
): Record<string, string> | undefined {
  if (!data) return undefined;

  const nestedErrors =
    data.errors && typeof data.errors === "object" && !Array.isArray(data.errors)
      ? (data.errors as Record<string, unknown>)
      : null;
  const source = nestedErrors ?? data;

  const entries = Object.entries(source).flatMap(([field, value]) => {
    if (["message", "error", "detail"].includes(field)) return [];
    const message = stringifyErrorValue(value);
    return message ? [[field, message] as const] : [];
  });

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function extractMessageFromData(data: Record<string, unknown> | null | undefined): string | null {
  if (!data) return null;

  if (typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }

  const parts = Object.entries(data)
    .flatMap(([key, value]) => {
      const message = stringifyErrorValue(value);
      return message ? [`${key}: ${message}`] : [];
    })
    .filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : null;
}

export function normalizeApiError(
  error: unknown,
  fallbackMessage: string = "Ocorreu um erro inesperado.",
): NormalizedApiError {
  if (error && typeof error === "object") {
    const maybeStatus = "status" in error ? error.status : undefined;
    const maybeData = "data" in error ? error.data : undefined;
    const maybeMessage = "message" in error ? error.message : undefined;

    const data =
      maybeData && typeof maybeData === "object"
        ? (maybeData as Record<string, unknown>)
        : null;

    const messageFromData = extractMessageFromData(data);
    const fieldErrors = extractFieldErrors(data);
    const message =
      messageFromData ||
      (typeof maybeMessage === "string" && maybeMessage.trim()) ||
      fallbackMessage;

    return {
      status: typeof maybeStatus === "number" ? maybeStatus : undefined,
      message,
      data,
      fieldErrors,
    };
  }

  if (error instanceof Error && error.message.trim()) {
    return { message: error.message };
  }

  return { message: fallbackMessage };
}
