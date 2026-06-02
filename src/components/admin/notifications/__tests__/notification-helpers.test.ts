import { describe, expect, it } from "vitest";
import {
  countPendingHarvesterValidations,
  harvesterValidationLink,
  isHarvesterValidation,
} from "../notification-helpers";
import type { Notification } from "@/types/api";

const harvesterDetails = {
  source: { id: "abc", name: "Test source", slug: "test-source" },
  status: "pending" as const,
};

const handledHarvesterDetails = {
  ...harvesterDetails,
  status: "accepted" as const,
};

function makeHarvesterNotification(
  partial: Partial<Notification> = {}
): Notification {
  return {
    id: partial.id ?? "n-1",
    created_at: "2026-05-12T16:08:26.771Z",
    last_modified: "2026-05-12T16:08:26.771Z",
    handled_at: null,
    user: null,
    details: harvesterDetails,
    ...partial,
  } as Notification;
}

describe("notification-helpers", () => {
  describe("isHarvesterValidation", () => {
    it("returns true for ValidateHarvesterNotificationDetails", () => {
      expect(isHarvesterValidation(harvesterDetails)).toBe(true);
    });

    it("returns false for DiscussionNotificationDetails", () => {
      const discussion = {
        discussion: "abc",
        status: "open",
        message_id: "m-1",
      };
      // The discriminator is `source` field: discussions don't have one.
      expect(isHarvesterValidation(discussion as never)).toBe(false);
    });

    it("returns false for TransferRequestNotificationDetails", () => {
      const transfer = {
        transfer_owner: {},
        transfer_recipient: {},
        transfer_subject: {},
      };
      expect(isHarvesterValidation(transfer as never)).toBe(false);
    });
  });

  describe("countPendingHarvesterValidations", () => {
    it("counts only unhandled harvester notifications with status=pending", () => {
      const items: Notification[] = [
        makeHarvesterNotification({ id: "a" }),
        makeHarvesterNotification({ id: "b" }),
        // handled — not counted
        makeHarvesterNotification({ id: "c", handled_at: "2026-05-13T00:00:00Z" }),
        // accepted status — not counted
        makeHarvesterNotification({ id: "d", details: handledHarvesterDetails }),
      ];
      expect(countPendingHarvesterValidations(items)).toBe(2);
    });

    it("ignores non-harvester notifications", () => {
      const discussion = {
        id: "e",
        created_at: "2026-05-12T00:00:00Z",
        last_modified: "2026-05-12T00:00:00Z",
        handled_at: null,
        user: null,
        details: {
          discussion: "x",
          status: "open",
          message_id: "y",
        },
      } as Notification;
      expect(countPendingHarvesterValidations([discussion])).toBe(0);
    });

    it("returns 0 on empty array", () => {
      expect(countPendingHarvesterValidations([])).toBe(0);
    });
  });

  describe("harvesterValidationLink", () => {
    it("builds admin link from source.slug", () => {
      expect(harvesterValidationLink(harvesterDetails)).toBe(
        "/pages/admin/system/harvesters/test-source"
      );
    });

    it("returns null when source is missing", () => {
      expect(harvesterValidationLink({ source: null, status: "pending" })).toBe(
        null
      );
    });

    it("returns null when slug is empty", () => {
      const details = {
        source: { id: "abc", name: "Test", slug: "" },
        status: "pending" as const,
      };
      expect(harvesterValidationLink(details)).toBe(null);
    });
  });
});
