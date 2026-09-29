import type { UserRef } from "./index";

export type InitialSession = { user: UserRef | null; renewCookie: boolean };
