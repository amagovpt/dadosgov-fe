/**
 * LEDG-2325: Agora's inputs declare `required = true` and only drop it when the
 * field is `disabled` or `readOnly`, so forwarding an absent `required` marked
 * every optional field as mandatory. In the harvester config that blocked saving
 * an edit on two fields the backend never required - "Licença por omissão" and
 * "Zonas geográficas".
 *
 * These tests pin the direction of the default, because the failure mode is
 * invisible in the code: a caller that simply omits the prop gets the opposite
 * of what it reads like.
 */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import IsolatedInput from "../IsolatedInput";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(node: React.ReactElement) {
  act(() => root.render(node));
  return container.querySelector("input") as HTMLInputElement;
}

describe("IsolatedInput required default", () => {
  it("is optional when the caller says nothing", () => {
    const input = render(<IsolatedInput label="Licença por omissão" id="extra-config-license" />);

    expect(input).not.toBeNull();
    expect(input.required).toBe(false);
  });

  it("is required when the caller asks for it", () => {
    const input = render(<IsolatedInput label="Título" id="edit-title" required />);

    expect(input.required).toBe(true);
  });

  it("honours an explicit false", () => {
    const input = render(<IsolatedInput label="Acrónimo" id="edit-acronym" required={false} />);

    expect(input.required).toBe(false);
  });
});
