import type { UserRef } from "@/service/types/identity";

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
