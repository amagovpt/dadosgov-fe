import type { Notification } from "@/service/types/notifications-reporting";
import type { APIResponse } from "@/service/types/shared";
import { API_AUTH_URL } from "@/service/utils/API";


// --- Notifications ---

export async function fetchNotifications(
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<Notification>> {
  const res = await fetch(
    `${API_AUTH_URL}/notifications/?page=${page}&page_size=${pageSize}`,
    { cache: "no-store", credentials: "include" }
  );

  if (res.status === 401) {
    throw new Error("Authentication required");
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch notifications: ${res.statusText}`);
  }

  return await res.json();
}


export async function markNotificationRead(id: string): Promise<Notification> {
  const res = await fetch(
    `${API_AUTH_URL}/notifications/${encodeURIComponent(id)}/read/`,
    { method: "POST", cache: "no-store", credentials: "include" }
  );

  if (res.status === 401) {
    throw new Error("Authentication required");
  }

  if (!res.ok) {
    throw new Error(`Failed to mark notification as read: ${res.statusText}`);
  }

  return await res.json();
}
