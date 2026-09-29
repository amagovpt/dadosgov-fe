/**
 * LEDG-2554: the warning that a resource is archived or deleted existed only on
 * the reuses screen, where the precedence was written by hand as
 * `{!reuse.deleted && reuse.archived && ...}`. Datasets and dataservices had no
 * warning at all.
 *
 * 🚩 These tests exist so that rule is proved ONCE for the three modules
 * instead of being verified by hand three times -- which is what copying the
 * guard into two more files would have required, and what the ticket is about.
 */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ResourceStatusBanner } from "../ResourceStatusBanner";
import type { ResourceStatusItem } from "../ResourceStatusBadge";

const MESSAGES = {
  deleted: "Este conjunto de dados foi eliminado.",
  archived: "Este conjunto de dados está arquivado.",
};

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

function render(item: ResourceStatusItem) {
  act(() => {
    root.render(<ResourceStatusBanner item={item} messages={MESSAGES} />);
  });
  return container.textContent ?? "";
}

describe("ResourceStatusBanner", () => {
  it("says nothing about a resource that is neither archived nor deleted", () => {
    expect(render({ private: true })).toBe("");
    expect(render({ private: false })).toBe("");
  });

  it("warns that a resource is archived", () => {
    expect(render({ archived: "2026-07-24T10:37:47" })).toContain(MESSAGES.archived);
  });

  it("warns that a resource is deleted", () => {
    expect(render({ deleted: "2026-09-25T10:55:14" })).toContain(MESSAGES.deleted);
  });

  /**
   * 🚩 Criterion 4 of the ticket, and the reason this component exists: a
   * resource archived and then deleted must produce ONE warning, about being
   * deleted -- never two stacked warnings saying different things.
   */
  it("shows only the deleted warning when the resource is also archived", () => {
    const text = render({
      archived: "2026-07-24T10:37:47",
      deleted: "2026-09-25T10:55:14",
    });
    expect(text).toContain(MESSAGES.deleted);
    expect(text).not.toContain(MESSAGES.archived);
  });

  it("reads the dataservices _at spelling the same way", () => {
    expect(render({ archived_at: "2026-07-24T10:37:47" })).toContain(MESSAGES.archived);
    expect(render({ deleted_at: "2026-09-25T10:55:14" })).toContain(MESSAGES.deleted);
  });
});
