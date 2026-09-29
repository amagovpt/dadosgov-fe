"use server";

import { fetchTabularApi } from "@/app/internal-api/_lib/fetch-tabular-api";

const EXPLORER_URL = process.env.EXPLORER_URL || "http://127.0.0.1:3030";

/**
 * returns the data explorer URL for a resource when tabular API has a
 * profile for it, otherwise null.
 */
export async function getExplorerUrl(resourceId: string): Promise<string | null> {
  const result = await fetchTabularApi(resourceId, "profile", "", "explorer-structure");
  return result.ok ? `${EXPLORER_URL}/explorer/${resourceId}/` : null;
}
