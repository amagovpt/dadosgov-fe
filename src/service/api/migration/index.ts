
// --- Account Migration ---

export async function fetchMigrationPending(): Promise<{
  pending: boolean;
  email?: string;
  has_email?: boolean;
  // The CMD email, offered as a pre-fill for the account-creation step, and
  // only present when no account already holds it.
  suggested_email?: string;
  candidate?: boolean;
  // The identity matched no account at all, as opposed to matching several
  // homonyms — both arrive with candidate false, and they need different
  // first steps. Only ever true when the identity also carries a NIC.
  no_match?: boolean;
  // The wizard is over, but the account it created is still waiting for its
  // owner to follow the confirmation link.
  awaiting_confirmation?: boolean;
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


// Mails a validation link to the address already on the candidate account.
// Takes no argument on purpose: the recipient is never one the caller names.
export async function sendMigrationLink(): Promise<{ sent: boolean }> {
  const res = await fetch("/saml/migration/send-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to send migration link");
  }
  return await res.json();
}


// Only the password proof remains: ownership by email is now proved by
// following the validation link, which the backend consumes on its own route.
export async function confirmMigration(
  payload: { method: "password"; email: string; password: string }
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


export async function skipMigration(email: string): Promise<{
  success: boolean;
  // The address the account was created with, echoed back so the wizard can
  // tell the user where the confirmation link went. When candidate_found is
  // set this is instead the MASKED address of the legacy account that was
  // found — never the address the user submitted.
  email?: string;
  // The submitted address belongs to a legacy account this identity can
  // legitimately claim, and the backend has pointed it as the candidate. Not
  // a failure to report: the wizard continues into the linking branch.
  candidate_found?: boolean;
}> {
  const res = await fetch("/saml/migration/skip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    // The error code carries which rejection it was (invalid_email,
    // email_taken, ...) so the caller can say something useful; throwing a
    // fixed string here would flatten them all into one message.
    const data = await res.json().catch(() => ({}));
    if (data.candidate_found) {
      // Refused as an account creation, but it resolved to an account the
      // user can link. Returning it keeps the outcome on the success path,
      // where the caller can route on it, instead of encoding "go here next"
      // in a thrown string.
      return { success: false, candidate_found: true, email: data.email };
    }
    throw new Error(data.error || "Failed to skip migration");
  }
  return await res.json();
}


export async function resendMigrationConfirmation(): Promise<{
  sent: boolean;
  // Already confirmed: nothing was resent, and the user can just log in.
  confirmed?: boolean;
}> {
  const res = await fetch("/saml/migration/resend-confirmation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to resend confirmation");
  }
  return await res.json();
}
