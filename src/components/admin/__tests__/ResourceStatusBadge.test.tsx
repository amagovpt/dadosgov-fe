/**
 * LEDG-2554: the edit screens showed RASCUNHO or PÚBLICO on resources that had
 * been archived or deleted, because each of the three wrote its own binary
 * ternary over `private` alone. They now share this badge, which the four
 * listings were already using -- and which, despite that, had never been
 * covered by a test. That is how a defect this visible survived months.
 *
 * What these tests pin is the PRECEDENCE, not the wording: deleted beats
 * archived beats private. A resource can carry both timestamps, so the order
 * is the whole decision.
 */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ptAdminCommon from "@/locales/pt/admin-common.json";

const translate = (key: string): string => {
  const raw = key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined,
      ptAdminCommon
    );
  return typeof raw === "string" ? raw : key;
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: translate }),
}));

import { ResourceStatusBadge, type ResourceStatusItem } from "../ResourceStatusBadge";

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

function render(item: ResourceStatusItem, display?: "dot" | "pill") {
  act(() => {
    root.render(<ResourceStatusBadge item={item} display={display} />);
  });
  return container.textContent?.trim() ?? "";
}

describe("ResourceStatusBadge", () => {
  describe.each(["dot", "pill"] as const)("as a %s", (display) => {
    it("says público when nothing is set", () => {
      expect(render({ private: false }, display)).toBe(ptAdminCommon.status.public);
    });

    it("says rascunho when private", () => {
      expect(render({ private: true }, display)).toBe(ptAdminCommon.status.draft);
    });

    it("says arquivado when archived, even while private", () => {
      expect(render({ private: true, archived: "2026-07-24T10:37:47" }, display)).toBe(
        ptAdminCommon.status.archived
      );
    });

    it("says eliminado when deleted", () => {
      expect(render({ deleted: "2026-09-25T10:55:14" }, display)).toBe(
        ptAdminCommon.status.deleted
      );
    });

    /**
     * 🚩 The case the whole ticket turns on. Archive a resource, then delete
     * it, and both timestamps are set: the badge must speak once, about the
     * later thing.
     */
    it("lets deleted win over archived when both are set", () => {
      expect(
        render(
          { private: true, archived: "2026-07-24T10:37:47", deleted: "2026-09-25T10:55:14" },
          display
        )
      ).toBe(ptAdminCommon.status.deleted);
    });

    /**
     * Datasets and reuses carry archived/deleted; dataservices carry the
     * timestamp-suffixed names. The badge is the one place that knows both,
     * which is what lets all three screens call it with their own object.
     */
    it("reads the dataservices _at spelling the same way", () => {
      expect(render({ archived_at: "2026-07-24T10:37:47" }, display)).toBe(
        ptAdminCommon.status.archived
      );
      expect(render({ deleted_at: "2026-09-25T10:55:14" }, display)).toBe(
        ptAdminCommon.status.deleted
      );
    });
  });

  it("draws a dot by default, so the listings are untouched", () => {
    render({ private: true });
    expect(container.querySelector("span > span")).not.toBeNull();
  });
});
