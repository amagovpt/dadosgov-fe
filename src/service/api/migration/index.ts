
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
  // Which identity provider started the flow. Every screen names it, and
  // nothing on this side can infer it: both ACS routes converge on the same
  // redirect. Defaults to CMD server-side for sessions older than the field.
  provider?: "cmd" | "eidas";
}> {
  const res = await fetch("/saml/migration/pending", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch migration status");
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


// The password says WHICH account to link; it does not complete the link.
// The backend mails the validation link and reports that it went out — the
// click is what binds the identity and starts a session.
export async function confirmMigration(
  payload: { method: "password"; email: string; password: string }
): Promise<{ sent: boolean }> {
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


// The backend answers this the same way whether or not the address already
// has an account, so there is nothing here to branch on: an address that is
// taken gets a mail of its own and this call still resolves. Anything the
// wizard could route on would be the enumeration oracle back again, one layer
// up.
export async function skipMigration(email: string): Promise<{
  success: boolean;
  // The address the mail went to, echoed back in the normalised form the
  // backend stores — the caller's own input either way, never a lookup result.
  email?: string;
}> {
  const res = await fetch("/saml/migration/skip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    // The error code carries which rejection it was (invalid_email,
    // nic_required, ...) so the caller can say something useful; throwing a
    // fixed string here would flatten them all into one message. None of them
    // depends on whether the address exists.
    const data = await res.json().catch(() => ({}));
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
