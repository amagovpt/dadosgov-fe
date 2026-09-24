import "server-only";

import { cache } from "react";
import { backendFetch, BACKEND_URL } from "@/app/backend-fetch";
import { fetchRemoteJson } from "@/app/internal-api/_lib/fetch-remote-json";
import type { Dataservice } from "@/service/types/dataservice";
import type { Dataset } from "@/service/types/dataset";
import type { APIResponse } from "@/service/types/shared";
import type { RelatedDatasetsResult, DataserviceDiscussionsResult, DataserviceActionsState } from "@/service/types/dataservice/detail";
import { getInitialSession } from "@/service/api/auth/server";
import { serverAuthHeaders } from "@/service/utils/serverForwardedHeaders";
import { ApiPageError } from "@/service/utils/apiErrorPolicy";
import { rethrowControlFlow } from "@/service/utils/rethrowControlFlow";
import { parseOpenApi, type ParsedSwagger } from "@/utils/parseOpenApi";

const requestHeaders = cache(serverAuthHeaders);

// React's cache is scoped to this server render, including metadata. It must
// not become a cross-request cache: visibility depends on the visitor's session.
export const getDataserviceDetail = cache(async (slug: string): Promise<Dataservice | null> => {
  const path = `/api/1/dataservices/${encodeURIComponent(slug)}/`;
  const response = await backendFetch(path, {
    headers: await requestHeaders(),
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  if (response.status === 404 || response.status === 410) return null;
  if (!response.ok) throw new ApiPageError(response.status, `${BACKEND_URL}${path}`);
  return response.json();
});

export async function getDataserviceDatasets(id: string): Promise<RelatedDatasetsResult> {
  try {
    const params = new URLSearchParams({ page: "1", page_size: "50", dataservice: id });
    const response = await backendFetch(`/api/1/datasets/?${params}`, {
      headers: await requestHeaders(),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`Related datasets request failed: ${response.status}`);
    const result: APIResponse<Dataset> = await response.json();
    return {
      total: result.total,
      data: result.data.map((dataset) => ({
        id: dataset.id,
        slug: dataset.slug,
        title: dataset.title,
        description: dataset.description,
        last_modified: dataset.last_modified,
        metrics: dataset.metrics,
        quality: dataset.quality ? { score: dataset.quality.score } : undefined,
        organization: dataset.organization ? {
          name: dataset.organization.name,
          logo: dataset.organization.logo ?? undefined,
        } : null,
        owner: dataset.owner ? {
          slug: dataset.owner.slug,
          first_name: dataset.owner.first_name,
          last_name: dataset.owner.last_name,
          avatar_thumbnail: dataset.owner.avatar_thumbnail,
        } : null,
      })),
    };
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error loading dataservice datasets:", error);
    return null;
  }
}

export async function getDataserviceSwagger(url: string | null): Promise<ParsedSwagger | null> {
  if (!url) return null;
  // Keep the existing URL/DNS/redirect checks and response-size limit. Visitor
  // cookies are only sent to the backend, never to publisher documentation URLs.
  const result = await fetchRemoteJson(url, { maxBytes: 3_000_000, logLabel: "dataservice-swagger" });
  return result.ok ? parseOpenApi(result.data) : null;
}

export async function getDataserviceDiscussions(id: string): Promise<DataserviceDiscussionsResult> {
  try {
    const params = new URLSearchParams({ for: id, page: "1", page_size: "20" });
    const response = await backendFetch(`/api/1/discussions/?${params}`, {
      headers: await requestHeaders(), cache: "no-store", signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`Discussions request failed: ${response.status}`);
    const { data, total } = await response.json();
    return { data, total };
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error loading dataservice discussions:", error);
    return null;
  }
}

export async function getDataserviceActions(dataservice: Dataservice): Promise<DataserviceActionsState> {
  const { user } = await getInitialSession();
  if (!user) return { userId: null, favorite: false, canEdit: false };
  const canEdit = Boolean(user.roles?.includes("admin") || dataservice.owner?.id === user.id ||
    (dataservice.organization && user.organizations?.some((org) => org.id === dataservice.organization?.id)));
  try {
    const params = new URLSearchParams({ user: user.id, page_size: "1" });
    const response = await backendFetch(`/api/1/dataservices/${encodeURIComponent(dataservice.id)}/followers/?${params}`, {
      headers: await requestHeaders(), cache: "no-store", signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Favourite status request failed: ${response.status}`);
    const result = await response.json();
    return { userId: user.id, canEdit, favorite: result.total > 0 };
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error loading dataservice favourite status:", error);
    return { userId: user.id, canEdit, favorite: null };
  }
}
