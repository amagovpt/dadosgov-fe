import DataserviceDetailClient from "@/components/dataservices/DataserviceDetailClient";
import { fetchDataservice } from "@/service/api/dataservices";
import { getFrontOfficeMetadata } from "@/service/queries/common";
import { stripHtmlTags } from "@/utils/htmlToParagraphs";
import { Metadata } from "next";

const PLACEHOLDER = "/images/placeholders/organization.png";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const dataservice = await fetchDataservice(slug);
    const description = stripHtmlTags(dataservice.description);
    const image =
      dataservice.organization?.logo || dataservice.owner?.avatar_thumbnail || PLACEHOLDER;

    return {
      title: dataservice.title,
      description,
      openGraph: {
        title: dataservice.title,
        description,
        ...(image ? { images: [image] } : {}),
      },
      ...(image ? { twitter: { card: "summary_large_image", images: [image] } } : {}),
    };
  } catch {
    const metadata = await getFrontOfficeMetadata("dataservices", locale);

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

  return <DataserviceDetailClient slug={slug} />;
}
