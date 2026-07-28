import ReuseDetailClient from "@/components/reuses/ReuseDetailClient";
import { fetchReuse } from "@/service/api/reuses";
import { fetchDataset } from "@/service/api/datasets";
import { fetchFullProfile } from "@/service/api/profile";
import { isFollowing } from "@/service/api/followers";
import { Dataset } from "@/service/types/dataset";
import { serverAuthHeaders } from "@/service/utils/serverForwardedHeaders";
import { getFrontOfficeMetadata } from "@/service/queries/common";
import { stripHtmlTags } from "@/utils/htmlToParagraphs";
import { Metadata } from "next";
import { notFound } from "next/navigation";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; rid: string }>;
}): Promise<Metadata> {
  const { locale, rid } = await params;

  // Use the reuse's own title/description/image so social shares render the
  // correct card. Public fetch (no session): private reuses fall through to the
  // generic frontoffice metadata below.
  try {
    const reuse = await fetchReuse(rid);
    const description = stripHtmlTags(reuse.description);
    const image = reuse.image_thumbnail ?? reuse.image ?? undefined;

    return {
      title: reuse.title,
      description,
      openGraph: {
        title: reuse.title,
        description,
        ...(image ? { images: [image] } : {}),
      },
      ...(image ? { twitter: { card: "summary_large_image", images: [image] } } : {}),
    };
  } catch {
    const metadata = await getFrontOfficeMetadata("reuses", locale);

    return {
      title: metadata.title,
      description: stripHtmlTags(metadata.description),
    };
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ rid: string }>;
}) {
  const { rid } = await params;

  // Authenticated SSR: forward the visitor's session so `permissions` and
  // private-draft visibility are correct in the server HTML (no client refetch).
  const forwarded = await serverAuthHeaders();

  let reuse;
  try {
    reuse = await fetchReuse(rid, forwarded);
  } catch {
    notFound();
  }

  // Hydrate the associated datasets on the server (was a client useEffect loop).
  const slugs = (reuse.datasets ?? []).map(
    (d) => d.uri.split("/").filter(Boolean).pop() || d.id
  );

  // Resolve the viewer's follow state on the server too (was a client
  // useEffect), so the favorite star is correct in the initial HTML. Skip the
  // backend round-trip for anonymous visitors — gate on the session cookie,
  // mirroring the anonymous short-circuit in src/app/auth/me/route.ts.
  const isAuthenticated = /(?:^|;\s*)(?:session|remember_token)=/.test(
    forwarded["Cookie"] ?? ""
  );

  const [initialDatasets, me] = await Promise.all([
    Promise.all(slugs.map((s) => fetchDataset(s, forwarded).catch(() => null))).then(
      (list) => list.filter((d): d is Dataset => d !== null)
    ),
    isAuthenticated ? fetchFullProfile(forwarded).catch(() => null) : Promise.resolve(null),
  ]);

  const initialIsFavorite = me?.id
    ? await isFollowing("reuses", reuse.id, me.id, forwarded)
    : false;

  return (
    <ReuseDetailClient
      reuse={reuse}
      initialDatasets={initialDatasets}
      initialIsFavorite={initialIsFavorite}
    />
  );
}
