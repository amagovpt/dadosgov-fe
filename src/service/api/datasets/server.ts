import "server-only";

import { backendFetch } from "@/app/backend-fetch";
import type { Dataset } from "@/service/types/dataset";
import type { SourceDataset } from "@/service/types/datastories/datastory";
import type { APIResponse } from "@/service/types/shared";
import { rethrowControlFlow } from "@/service/utils/rethrowControlFlow";
import { getDatasetLastUpdate } from "@/utils/datasetDates";

type RelatedDatasetsSearch = {
  // Unquoted on purpose: quoting a phrase ORs its words and matches thousands of datasets
  terms: string[];
  // The program's own organization: its datasets are listed first. The API's `organization`
  // filter only accepts the id, not the slug.
  ownOrganizationId: string;
  // Also list every dataset of that organization, whether the text searches match it or not
  includeOwnOrganization: boolean;
};

const RELATED_DATASETS = {
  prr: {
    terms: ["prr", "plano de recuperação e resiliência"],
    ownOrganizationId: "61140a0107819099529af103",
    includeOwnOrganization: true,
  },
  pt2030: {
    terms: ["pt2030"],
    ownOrganizationId: "600850ac454ae38cbce87116",
    includeOwnOrganization: false,
  },
} satisfies Record<string, RelatedDatasetsSearch>;

export type RelatedDatasetsProgram = keyof typeof RELATED_DATASETS;

const PAGE_SIZE = "100";

// The same date the /datasets cards show
function updatedAt(dataset: Dataset): string {
  return getDatasetLastUpdate(dataset) ?? "";
}

function toSourceDataset(dataset: Dataset): SourceDataset {
  const { owner } = dataset;
  return {
    slug: dataset.slug,
    title: dataset.title,
    description: dataset.description,
    createdAt: updatedAt(dataset),
    // Empty without an organization, so the card falls back to the owner like /datasets does
    organizationName: dataset.organization?.name ?? "",
    image: dataset.organization?.logo ? [dataset.organization.logo] : [],
    metrics: dataset.metrics,
    quality: dataset.quality ? { score: dataset.quality.score } : undefined,
    badges: dataset.badges,
    owner: owner && {
      slug: owner.slug,
      first_name: owner.first_name,
      last_name: owner.last_name,
      avatar_thumbnail: owner.avatar_thumbnail,
    },
  };
}

async function searchDatasets(filter: Record<string, string>): Promise<Dataset[]> {
  const params = new URLSearchParams({ page: "1", page_size: PAGE_SIZE, ...filter });
  const response = await backendFetch(`/api/1/datasets/?${params}`, {
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Related datasets search failed: ${response.status}`);
  const result: APIResponse<Dataset> = await response.json();
  return result.data;
}

export async function getRelatedDatasets(
  program: RelatedDatasetsProgram
): Promise<SourceDataset[]> {
  const { terms, ownOrganizationId, includeOwnOrganization } = RELATED_DATASETS[program];
  const searches = await Promise.allSettled([
    ...terms.map((q) => searchDatasets({ q })),
    ...(includeOwnOrganization ? [searchDatasets({ organization: ownOrganizationId })] : []),
  ]);

  const byId = new Map<string, Dataset>();
  for (const search of searches) {
    if (search.status === "rejected") {
      rethrowControlFlow(search.reason);
      console.error(`Error loading ${program} related datasets:`, search.reason);
      continue;
    }
    for (const dataset of search.value) byId.set(dataset.id, dataset);
  }

  const isOwn = (dataset: Dataset) => Number(dataset.organization?.id === ownOrganizationId);
  return [...byId.values()]
    .sort(
      (a, b) => isOwn(b) - isOwn(a) || Date.parse(updatedAt(b)) - Date.parse(updatedAt(a))
    )
    .map(toSourceDataset);
}
