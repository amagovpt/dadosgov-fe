import DatasetDetailClient from "@/components/datasets/DatasetDetailClient";
import { fetchDataset } from "@/service/api/datasets";
import { getFrontOfficeMetadata } from "@/service/queries/common";
import { rethrowControlFlow } from "@/service/utils/rethrowControlFlow";
import { serverAuthHeaders } from "@/service/utils/serverForwardedHeaders";
import { stripHtmlTags } from "@/utils/htmlToParagraphs";
import { Metadata } from "next";
import { notFound } from "next/navigation";

const PLACEHOLDER = "/images/placeholders/organization.png";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const dataset = await fetchDataset(slug);
    const description = stripHtmlTags(dataset.description);
    const image = dataset.organization?.logo || dataset.owner?.avatar_thumbnail || PLACEHOLDER;

    return {
      title: dataset.title,
      description,
      openGraph: {
        title: dataset.title,
        description,
        ...(image ? { images: [image] } : {}),
      },
      ...(image ? { twitter: { card: "summary_large_image", images: [image] } } : {}),
    };
  } catch {
    const metadata = await getFrontOfficeMetadata("datasets", locale);

    return {
      title: metadata.title,
      description: stripHtmlTags(metadata.description),
    };
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const forwarded = await serverAuthHeaders();

  let dataset;
  try {
    dataset = await fetchDataset(slug, forwarded);
  } catch (error) {
    // Only a dataset that genuinely is not there is a 404. A refusal (401, 403)
    // or a backend failure reaches the error boundary instead, which can say
    // which of them it was — telling someone a private dataset "does not exist"
    // sends them looking for a link that was never broken.
    rethrowControlFlow(error);
    notFound();
  }

  return <DatasetDetailClient dataset={dataset} />;
}
