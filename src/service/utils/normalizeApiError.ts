export interface NormalizedApiError {
  status?: number;
  message: string;
  data?: Record<string, unknown> | null;
}

function extractMessageFromData(data: Record<string, unknown> | null | undefined): string | null {
  if (!data) return null;

  if (typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }

  const parts = Object.entries(data)
    .flatMap(([key, value]) => {
      if (value == null) return [];
      if (typeof value === "string") return [`${key}: ${value}`];
      if (Array.isArray(value)) return [`${key}: ${value.join(", ")}`];
      if (typeof value === "object") return [`${key}: ${JSON.stringify(value)}`];
      return [`${key}: ${String(value)}`];
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
    const message =
      (typeof maybeMessage === "string" && maybeMessage.trim()) ||
      messageFromData ||
      fallbackMessage;

    return {
      status: typeof maybeStatus === "number" ? maybeStatus : undefined,
      message,
      data,
    };
  }

  if (error instanceof Error && error.message.trim()) {
    return { message: error.message };
  }

  return { message: fallbackMessage };
}
