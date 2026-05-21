import { UserRef } from "@/service/types/api";

/**
 * Fetch CSRF token from backend
 */
export async function fetchCsrfToken(): Promise<string> {
  const res = await fetch("/csrf", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch CSRF token");
  const data = await res.json();
  return data.csrf_token;
}

/**
 * Perform login using the frontend route handler proxy
 */
export async function login(formData: FormData): Promise<{ message: string; redirect?: string }> {
  const params = new URLSearchParams();
  for (const [key, value] of formData.entries()) {
    params.append(key, typeof value === "string" ? value : value.name);
  }

  const res = await fetch("/login", {
    method: "POST",
    body: params,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Login failed");
  }
  return data;
}

/**
 * Perform logout
 */
export async function logout(): Promise<void> {
  const res = await fetch("/logout", { method: "GET" });
  if (!res.ok) throw new Error("Logout failed");
}

/**
 * Fetch the currently authenticated user profile
 */
export async function fetchCurrentUser(): Promise<UserRef | null> {
  try {
    const res = await fetch("/me", { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
