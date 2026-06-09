import type { Transfer, TransferRequestPayload } from "@/service/types/transfer-system";
import { API_AUTH_URL } from "@/service/utils/API";


export async function requestTransfer(payload: TransferRequestPayload): Promise<Transfer> {
  const res = await fetch(`${API_AUTH_URL}/transfer/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      detail = data?.message
        ? data.message
        : data?.errors
          ? JSON.stringify(data.errors)
          : "";
    } catch {
      // ignore — keep generic message
    }
    throw new Error(detail || `Failed to request transfer: ${res.statusText}`);
  }
  return await res.json();
}
