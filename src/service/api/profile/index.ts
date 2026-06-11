import type { ApiToken, ApiTokenCreated, UserMetrics, UserPublic } from "@/service/types/identity";
import { API_AUTH_URL, translateUploadErrorPayload } from "@/service/utils/API";


export async function uploadAvatar(file: File): Promise<{ image: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_AUTH_URL}/me/avatar/`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, data: translateUploadErrorPayload(error) };
  }
  return await res.json();
}


export async function deleteAvatar(): Promise<void> {
  const res = await fetch(`${API_AUTH_URL}/me/avatar/`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    throw { status: res.status };
  }
}


export async function fetchFullProfile(): Promise<UserPublic> {
  const res = await fetch(`${API_AUTH_URL}/me/`, {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to fetch profile: ${res.statusText}`);
  return await res.json();
}


export async function fetchApiTokens(): Promise<ApiToken[]> {
  const res = await fetch(`${API_AUTH_URL}/me/api_tokens/`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to fetch API tokens: ${res.statusText}`);
  return await res.json();
}


export async function generateApiKey(name?: string): Promise<ApiTokenCreated> {
  const res = await fetch(`${API_AUTH_URL}/me/api_tokens/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(name ? { name } : {}),
  });
  if (!res.ok) throw new Error(`Failed to generate API key: ${res.statusText}`);
  return await res.json();
}


export async function revokeApiToken(tokenId: string): Promise<void> {
  const res = await fetch(`${API_AUTH_URL}/me/api_tokens/${tokenId}/`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to revoke API token: ${res.statusText}`);
}


export async function requestEmailChange(
  newEmail: string
): Promise<{ message: string }> {
  // The route handler now mints CSRF server-side on the authenticated session.
  // Fetching /csrf from the client creates an anonymous session and breaks auth.
  const body = new URLSearchParams({
    new_email: newEmail,
    new_email_confirm: newEmail,
  });
  const res = await fetch("/change-email", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    credentials: "include",
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to request email change");
  return data;
}


export async function changePassword(
  currentPassword: string,
  newPassword: string,
  newPasswordConfirm: string
): Promise<{ message: string }> {
  // The route handler now mints CSRF server-side on the authenticated session.
  // Fetching /csrf from the client creates an anonymous session and breaks auth.
  const body = new URLSearchParams({
    password: currentPassword,
    new_password: newPassword,
    new_password_confirm: newPasswordConfirm,
  });
  const res = await fetch("/change", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    credentials: "include",
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to change password");
  return data;
}


export async function deleteAccount(): Promise<void> {
  const res = await fetch(`${API_AUTH_URL}/me/`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to delete account: ${res.statusText}`);
}


export async function fetchMyMetrics(): Promise<UserMetrics> {
  const res = await fetch(`${API_AUTH_URL}/me/metrics/`, {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to fetch user metrics: ${res.statusText}`);
  return await res.json();
}
