import type { APIRequestContext, APIResponse } from "playwright/test";

/**
 * Backend HTTP helpers for authenticated regression specs.
 *
 * Notes on auth:
 *   - The udata `/api/1` blueprint is decorated with `csrf.exempt`
 *     (backend/udata/api/__init__.py), so a valid session cookie is the
 *     only thing the API requires. Playwright's `request` fixture inherits
 *     the storage state from `auth-setup` (admin.json) and applies the
 *     cookie automatically.
 *   - `WTF_CSRF_ENABLED = False` in test config and forms are validated
 *     with `meta={"csrf": False}` — no token dance from us.
 *
 * All helpers return the parsed JSON body when the response is 2xx, or
 * throw a descriptive error otherwise (with status + body in the message)
 * so a failure surfaces a useful traceback in Playwright's output.
 */

export interface BackendErrorPayload {
  message?: string;
  errors?: Record<string, unknown>;
  [key: string]: unknown;
}

async function readBody(res: APIResponse): Promise<BackendErrorPayload | string> {
  const text = await res.text();
  try {
    return JSON.parse(text) as BackendErrorPayload;
  } catch {
    return text;
  }
}

async function expectOk<T>(
  res: APIResponse,
  context: string,
  expectedStatuses: number[] = [200, 201, 204],
): Promise<T> {
  if (!expectedStatuses.includes(res.status())) {
    const body = await readBody(res);
    throw new Error(
      `[${context}] expected ${expectedStatuses.join("/")}, got ${res.status()}: ` +
        (typeof body === "string" ? body : JSON.stringify(body)),
    );
  }
  if (res.status() === 204) return undefined as T;
  return (await res.json()) as T;
}

export function randomSuffix(): string {
  // 8-char alphanumeric. Random enough to avoid worker collisions even at
  // workers=4+, short enough to fit in slug length limits.
  return Math.random().toString(36).slice(2, 10);
}

export interface CreatedOrganization {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

/** Create an organization. Caller is responsible for `deleteOrganization`. */
export async function createOrganization(
  request: APIRequestContext,
  payload: {
    name: string;
    description?: string;
    acronym?: string;
    url?: string;
  },
): Promise<CreatedOrganization> {
  const res = await request.post("/api/1/organizations/", {
    headers: { "Content-Type": "application/json" },
    data: payload,
    failOnStatusCode: false,
  });
  return expectOk<CreatedOrganization>(res, "POST /api/1/organizations/", [201]);
}

/**
 * Update an organization (no rate-limit; same sanitization pipeline as POST
 * since both routes go through `OrganizationForm.validate()` → `pre_save`).
 * Specs that need multiple description shapes against the same org should
 * `createOrganization` once and `updateOrganization` many times instead of
 * paying the HEAVY_CREATE_LIMIT (2/min) for every variant.
 */
export async function updateOrganization(
  request: APIRequestContext,
  slugOrId: string,
  payload: {
    name: string;
    description?: string;
    acronym?: string;
    url?: string;
  },
): Promise<CreatedOrganization> {
  const res = await request.put(`/api/1/organizations/${slugOrId}/`, {
    headers: { "Content-Type": "application/json" },
    data: payload,
    failOnStatusCode: false,
  });
  return expectOk<CreatedOrganization>(res, `PUT /api/1/organizations/${slugOrId}/`, [200]);
}

/** Soft-delete an organization (sets deleted timestamp; record stays in DB). */
export async function deleteOrganization(
  request: APIRequestContext,
  slugOrId: string,
): Promise<void> {
  const res = await request.delete(`/api/1/organizations/${slugOrId}/`, {
    failOnStatusCode: false,
  });
  if (res.status() !== 204 && res.status() !== 410) {
    const body = await readBody(res);
    throw new Error(
      `DELETE /api/1/organizations/${slugOrId}/ failed: ${res.status()} ${
        typeof body === "string" ? body : JSON.stringify(body)
      }`,
    );
  }
}

export interface CreatedReuse {
  id: string;
  slug: string;
  title: string;
  description: string;
}

export async function createReuse(
  request: APIRequestContext,
  payload: {
    title: string;
    description: string;
    type: string;
    topic: string;
    url: string;
    datasets?: string[];
  },
): Promise<CreatedReuse> {
  const body: Record<string, unknown> = { ...payload };
  // The API marshalls `datasets` as nested objects; the create path accepts
  // bare IDs in an array but the field is named `datasets`.
  if (payload.datasets) {
    body.datasets = payload.datasets.map((id) => ({ id }));
  }
  const res = await request.post("/api/1/reuses/", {
    headers: { "Content-Type": "application/json" },
    data: body,
    failOnStatusCode: false,
  });
  return expectOk<CreatedReuse>(res, "POST /api/1/reuses/", [201]);
}

export async function deleteReuse(
  request: APIRequestContext,
  id: string,
): Promise<void> {
  const res = await request.delete(`/api/1/reuses/${id}/`, {
    failOnStatusCode: false,
  });
  if (res.status() !== 204 && res.status() !== 410 && res.status() !== 404) {
    const body = await readBody(res);
    throw new Error(
      `DELETE /api/1/reuses/${id}/ failed: ${res.status()} ${
        typeof body === "string" ? body : JSON.stringify(body)
      }`,
    );
  }
}

export interface CreatedCommunityResource {
  id: string;
  title: string;
  url: string;
}

/** Returns the raw response so the caller can introspect status / headers. */
export async function postCommunityResource(
  request: APIRequestContext,
  payload: {
    dataset: string;
    title: string;
    description?: string;
    url: string;
    format?: string;
  },
): Promise<APIResponse> {
  return request.post("/api/1/datasets/community_resources/", {
    headers: { "Content-Type": "application/json" },
    data: {
      title: payload.title,
      description: payload.description ?? "vulnerability regression spec",
      filetype: "remote",
      type: "other",
      url: payload.url,
      format: payload.format ?? "csv",
      dataset: payload.dataset,
    },
    failOnStatusCode: false,
  });
}

export async function deleteCommunityResource(
  request: APIRequestContext,
  id: string,
): Promise<void> {
  const res = await request.delete(`/api/1/datasets/community_resources/${id}/`, {
    failOnStatusCode: false,
  });
  if (res.status() !== 204 && res.status() !== 404 && res.status() !== 410) {
    const body = await readBody(res);
    throw new Error(
      `DELETE community_resource ${id}: ${res.status()} ${
        typeof body === "string" ? body : JSON.stringify(body)
      }`,
    );
  }
}

/** Light wrapper for read-only fetches used by the assertion phase. */
export async function getJson<T>(
  request: APIRequestContext,
  path: string,
): Promise<T> {
  const res = await request.get(path, { failOnStatusCode: false });
  return expectOk<T>(res, `GET ${path}`);
}
