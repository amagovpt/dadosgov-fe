import { afterEach, describe, expect, it, vi } from "vitest";
import { revealFirstFormError } from "./useFormErrors";

describe("revealFirstFormError", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("focuses and scrolls the first invalid field", () => {
    document.body.innerHTML = `
      <input id="first" aria-invalid="true" />
      <input id="second" aria-invalid="true" />
    `;
    const first = document.querySelector<HTMLElement>("#first")!;
    const scrollIntoView = vi.fn();
    first.scrollIntoView = scrollIntoView;

    expect(revealFirstFormError()).toBe(first);
    expect(document.activeElement).toBe(first);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "center" });
  });

  it("focuses a field nested inside an invalid design-system wrapper", () => {
    document.body.innerHTML = `
      <div id="wrapper" aria-invalid="true"><input id="nested" /></div>
    `;
    const wrapper = document.querySelector<HTMLElement>("#wrapper")!;
    const nested = document.querySelector<HTMLElement>("#nested")!;
    wrapper.scrollIntoView = vi.fn();

    expect(revealFirstFormError()).toBe(nested);
    expect(document.activeElement).toBe(nested);
  });

  it("does nothing when no invalid field exists", () => {
    expect(revealFirstFormError()).toBeNull();
  });
});
