export function sanitizeNextUrl(raw: string | null): string {
  const value = raw || "/";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export function buildSamlEndpoint(base: string, nextUrl: string): string {
  return nextUrl !== "/" ? `${base}?next=${encodeURIComponent(nextUrl)}` : base;
}

export async function submitSamlForm(endpoint: string): Promise<string | null> {
  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      const text = await res.text();
      console.error("SAML login failed:", res.status, text);
      return `Erro ao iniciar autenticação (${res.status}). Tente novamente.`;
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      console.error("SAML login: unexpected response type:", contentType, text.substring(0, 500));
      return "Erro ao iniciar autenticação. O servidor não respondeu corretamente.";
    }

    const data = await res.json();
    if (!data.action || !data.SAMLRequest) {
      console.error("SAML login: missing fields in response:", data);
      return "Erro ao iniciar autenticação. Resposta incompleta do servidor.";
    }

    const form = document.createElement("form");
    form.method = "POST";
    form.action = data.action;

    const samlInput = document.createElement("input");
    samlInput.type = "hidden";
    samlInput.name = "SAMLRequest";
    samlInput.value = data.SAMLRequest;
    form.appendChild(samlInput);

    const relayInput = document.createElement("input");
    relayInput.type = "hidden";
    relayInput.name = "RelayState";
    relayInput.value = data.RelayState;
    form.appendChild(relayInput);

    document.body.appendChild(form);
    form.submit();
    return null;
  } catch (e) {
    console.error("SAML login error:", e);
    return "Não foi possível contactar o servidor de autenticação. Verifique a sua ligação.";
  }
}
