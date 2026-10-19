import { afterEach, describe, expect, it, vi } from "vitest";

import { checkBackendVersion } from "@/lib/server/checkBackendVersion";

const answerWith = (body: unknown, ok = true) =>
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok, json: async () => body }));

describe("checkBackendVersion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    // Sem isto, um vi.spyOn sobre console.error devolve o espião do teste
    // anterior, com as chamadas dele à mistura.
    vi.restoreAllMocks();
  });

  it("grita quando o backend e anterior ao minimo", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    answerWith({ version: "15.1.0" });
    await checkBackendVersion();
    expect(error).toHaveBeenCalledWith(expect.stringContaining("BACKEND TOO OLD"));
    expect(error.mock.calls[0][0]).toContain("15.1.0");
  });

  it("cala-se quando o backend cumpre", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    answerWith({ version: "16.0.0.12" });
    await checkBackendVersion();
    expect(error).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith(expect.stringContaining("16.0.0.12"));
  });

  it("nao rebenta nem grita com o backend em baixo", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    await expect(checkBackendVersion()).resolves.toBeUndefined();
    expect(error).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith(expect.stringContaining("ECONNREFUSED"));
  });

  it("nao grita quando o backend nao reporta versao", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    answerWith({});
    await checkBackendVersion();
    expect(error).not.toHaveBeenCalled();
  });
});
