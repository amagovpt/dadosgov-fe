/**
 * The Usercentrics autoblocker rewrites third-party iframes (Power BI) in the
 * server HTML before React hydrates, which broke hydration on datastories.
 * The iframe must therefore exist only after mount.
 */

import { act } from "react";
import { renderToString } from "react-dom/server";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";

import InfoBlockIFrame from "../InfoBlockIFrame";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SRC = "https://app.powerbi.com/view?r=abc";

describe("InfoBlockIFrame", () => {
  it("renders no iframe on the server", () => {
    expect(renderToString(<InfoBlockIFrame src={SRC} />)).not.toContain("<iframe");
  });

  it("renders the embed after mount", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => root.render(<InfoBlockIFrame src={SRC} />));

    const iframe = container.querySelector("iframe");
    expect(iframe?.src).toContain("app.powerbi.com/view");
    expect(iframe?.src).toContain("chromeless=1");
    act(() => root.unmount());
  });
});
