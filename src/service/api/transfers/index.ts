import type { Transfer, TransferRequestPayload } from "@/service/types/transfer-system";
import { API_AUTH_URL } from "@/service/utils/API";

export async function requestTransfer(payload: TransferRequestPayload): Promise<Transfer> {
  const res = await fetch(`${API_AUTH_URL}/transfer/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return readTransferResponse<Transfer>(res);
}

export async function fetchTransfers(recipient: string): Promise<Transfer[]> {
  const query = new URLSearchParams({ recipient });
  const res = await fetch(`${API_AUTH_URL}/transfer/?${query}`, {
    cache: "no-store",
    credentials: "include",
  });
  return readTransferResponse<Transfer[]>(res);
}

export async function respondToTransfer(
  id: string,
  response: "accept" | "refuse"
): Promise<Transfer> {
  const res = await fetch(`${API_AUTH_URL}/transfer/${encodeURIComponent(id)}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ response }),
  });
  return readTransferResponse<Transfer>(res);
}

async function readTransferResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      detail = data?.message ? data.message : data?.errors ? JSON.stringify(data.errors) : "";
    } catch {
      // ignore — keep generic message
    }
    throw new Error(detail || `Transfer request failed: ${res.statusText}`);
  }
  return await res.json();
}
