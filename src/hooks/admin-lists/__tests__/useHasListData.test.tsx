/**
 * Admin lists draw their search bar and status toggle only once the list has data: not during
 * the first load, not when the API returned nothing. Once shown they stay, so a search with no
 * results keeps the (uncontrolled) search bar and what the user typed in it.
 */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useHasListData } from "../useHasListData";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type ProbeProps = { isLoading: boolean; hasData: boolean; hasActiveFilters?: boolean };

let container: HTMLDivElement;
let root: Root;

function Probe({ isLoading, hasData, hasActiveFilters }: ProbeProps) {
  return <>{String(useHasListData(isLoading, hasData, hasActiveFilters))}</>;
}

function render(props: ProbeProps) {
  act(() => root.render(<Probe {...props} />));
  return container.textContent === "true";
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("useHasListData", () => {
  it("hides the controls during the first load", () => {
    expect(render({ isLoading: true, hasData: false })).toBe(false);
  });

  it("keeps them hidden when the first load returns no data", () => {
    render({ isLoading: true, hasData: false });
    expect(render({ isLoading: false, hasData: false })).toBe(false);
  });

  it("shows them once data arrives", () => {
    render({ isLoading: true, hasData: false });
    expect(render({ isLoading: false, hasData: true })).toBe(true);
  });

  it("keeps them while refetching and when a later search returns nothing", () => {
    render({ isLoading: false, hasData: true });
    expect(render({ isLoading: true, hasData: true })).toBe(true);
    expect(render({ isLoading: false, hasData: false })).toBe(true);
  });

  it("shows them when a pre-set filter matches nothing", () => {
    expect(render({ isLoading: false, hasData: false, hasActiveFilters: true })).toBe(true);
  });
});
