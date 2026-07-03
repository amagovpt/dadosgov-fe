import { redirect } from "next/navigation";

type RegisterSearchParams = {
  next?: string | string[];
  email?: string | string[];
};

function firstValue(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<RegisterSearchParams>;
}) {
  const params = await searchParams;
  const next = firstValue(params.next);
  const email = firstValue(params.email);

  const query = new URLSearchParams();
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    query.set("next", next);
  }
  if (email) {
    query.set("email", email);
  }
  const qs = query.toString();
  redirect(`/login${qs ? `?${qs}` : ""}`);
}
