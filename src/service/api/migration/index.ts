
// --- Account Migration ---

export async function fetchMigrationPending(): Promise<{
  pending: boolean;
  email?: string;
  has_email?: boolean;
  first_name?: string;
  last_name?: string;
}> {
  const res = await fetch("/saml/migration/pending", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch migration status");
  return await res.json();
}


export async function searchMigrationAccount(
  payload: { email?: string; first_name?: string; last_name?: string }
): Promise<{ found: boolean; email?: string }> {
  const res = await fetch("/saml/migration/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to search migration account");
  return await res.json();
}


export async function sendMigrationCode(): Promise<{ sent: boolean }> {
  const res = await fetch("/saml/migration/send-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to send migration code");
  }
  return await res.json();
}


export async function confirmMigration(
  payload: { method: "code"; code: string } | { method: "password"; password: string }
): Promise<{ success: boolean }> {
  const res = await fetch("/saml/migration/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to confirm migration");
  }
  return await res.json();
}


export async function skipMigration(): Promise<{ success: boolean }> {
  const res = await fetch("/saml/migration/skip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to skip migration");
  return await res.json();
}
