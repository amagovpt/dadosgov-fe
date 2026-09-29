"use server";

import { TABULAR_API_URL } from "../../../../../../next.config";

export async function getStructure(resourceId: string): Promise<boolean> {
  try {
    const apiUrl = `http://${TABULAR_API_URL}/api/resources/${resourceId}/profile/`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
    });

    if (response.status === 404 || !response.ok) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
