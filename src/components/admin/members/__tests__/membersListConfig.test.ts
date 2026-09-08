/**
 * LEDG-2294: the members table rendered a role column with no way to sort it,
 * while name and join date were already sortable in the same config.
 */

import { describe, expect, it } from "vitest";
import { sortMembers } from "../membersListConfig";
import type { OrganizationMember } from "@/service/types/identity";

function makeMember(partial: Partial<OrganizationMember> = {}): OrganizationMember {
  return {
    role: "editor",
    since: "2026-01-01T00:00:00Z",
    user: { id: "u-1", first_name: "Ana", last_name: "Silva" },
    ...partial,
  } as OrganizationMember;
}

const admin = makeMember({ role: "admin", user: { id: "u-1" } as OrganizationMember["user"] });
const editor = makeMember({ role: "editor", user: { id: "u-2" } as OrganizationMember["user"] });
const otherAdmin = makeMember({
  role: "admin",
  user: { id: "u-3" } as OrganizationMember["user"],
});

const members = [editor, admin, otherAdmin];
const ids = (list: OrganizationMember[]) => list.map((member) => member.user.id);

describe("sortMembers by role", () => {
  it("groups admins before editors ascending, and the reverse descending", () => {
    expect(ids(sortMembers(members, "role", "ascending"))).toEqual(["u-1", "u-3", "u-2"]);
    expect(ids(sortMembers(members, "role", "descending"))).toEqual(["u-2", "u-1", "u-3"]);
  });

  it("leaves the order untouched with no field or no direction", () => {
    expect(ids(sortMembers(members, null, "ascending"))).toEqual(ids(members));
    expect(ids(sortMembers(members, "role", "none"))).toEqual(ids(members));
  });

  it("does not mutate the array it was given", () => {
    const original = [...members];
    sortMembers(members, "role", "descending");
    expect(members).toEqual(original);
  });
});
