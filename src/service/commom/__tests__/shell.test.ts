// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { HeaderNavigationData } from "@/service/types/header";
import type { Footer } from "@/service/types/header/footer";

vi.mock("../header", () => ({ getHeaderNavigation: vi.fn() }));
vi.mock("../footer", () => ({ getFooter: vi.fn() }));

import { getFooter } from "../footer";
import { getHeaderNavigation } from "../header";
import { ShellUnavailableError, loadShellData } from "../shell";

const header = vi.mocked(getHeaderNavigation);
const footer = vi.mocked(getFooter);

const HEADER = { topLevelLinks: [] } as unknown as HeaderNavigationData;
const FOOTER = { title: "dados.gov.pt" } as unknown as Footer;

describe("loadShellData", () => {
  beforeEach(() => {
    // The layout logs both failures; keep the test output readable.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns both halves when the CMS answers", async () => {
    header.mockResolvedValue(HEADER);
    footer.mockResolvedValue(FOOTER);

    await expect(loadShellData("pt")).resolves.toEqual({
      headerNavigation: HEADER,
      footerData: FOOTER,
    });
  });

  it("degrades to an empty header when only the header query fails", async () => {
    header.mockRejectedValue(new Error("header schema changed"));
    footer.mockResolvedValue(FOOTER);

    await expect(loadShellData("pt")).resolves.toEqual({
      headerNavigation: {},
      footerData: FOOTER,
    });
  });

  it("degrades to an empty footer when only the footer query fails", async () => {
    header.mockResolvedValue(HEADER);
    footer.mockRejectedValue(new Error("footer schema changed"));

    await expect(loadShellData("pt")).resolves.toEqual({
      headerNavigation: HEADER,
      footerData: {},
    });
  });

  it("throws when both fail: there is no shell left to render", async () => {
    const cause = new Error("connect ECONNREFUSED");
    header.mockRejectedValue(cause);
    footer.mockRejectedValue(new Error("connect ECONNREFUSED"));

    await expect(loadShellData("pt")).rejects.toBeInstanceOf(ShellUnavailableError);
    await expect(loadShellData("pt")).rejects.toMatchObject({ cause });
  });

  it("still degrades during a production build, so a CMS outage cannot fail the build", async () => {
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    header.mockRejectedValue(new Error("connect ECONNREFUSED"));
    footer.mockRejectedValue(new Error("connect ECONNREFUSED"));

    await expect(loadShellData("pt")).resolves.toEqual({
      headerNavigation: {},
      footerData: {},
    });
  });
});
