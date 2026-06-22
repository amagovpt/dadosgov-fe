import { describe, expect, it } from "vitest";
import { normalizeApiError } from "./normalizeApiError";

describe("normalizeApiError", () => {
  it("prefers a server message over a generic transport message", () => {
    expect(
      normalizeApiError({
        status: 400,
        message: "Request failed",
        data: { message: "O pedido contém dados inválidos." },
      }),
    ).toEqual({
      status: 400,
      message: "O pedido contém dados inválidos.",
      data: { message: "O pedido contém dados inválidos." },
      fieldErrors: undefined,
    });
  });

  it("extracts nested field errors", () => {
    const normalized = normalizeApiError({
      status: 422,
      data: { errors: { title: ["Campo obrigatório"], url: "URL inválido" } },
    });

    expect(normalized.fieldErrors).toEqual({
      title: "Campo obrigatório",
      url: "URL inválido",
    });
    expect(normalized.message).toContain("errors:");
  });

  it("uses Error messages and the supplied fallback", () => {
    expect(normalizeApiError(new Error("Falha de rede")).message).toBe("Falha de rede");
    expect(normalizeApiError(null, "Tente novamente.").message).toBe("Tente novamente.");
  });
});
