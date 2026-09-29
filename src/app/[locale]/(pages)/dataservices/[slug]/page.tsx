import DataserviceDetail from "@/components/dataservices/DataserviceDetail";
import { getDataserviceDetail, getDataserviceDatasets, getDataserviceSwagger, getDataserviceDiscussions, getDataserviceActions } from "@/service/api/dataservices/server";
import { getFrontOfficeMetadata } from "@/service/queries/common";
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
    const dataservice = await getDataserviceDetail(slug);
    if (!dataservice || dataservice.private) {
      const metadata = await getFrontOfficeMetadata("dataservices", locale);
      return { title: metadata.title, description: stripHtmlTags(metadata.description) };
    }
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
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const dataservice = await getDataserviceDetail(slug);
  if (!dataservice) notFound();

  // Start optional sections now, without delaying the main details.
  const datasets = getDataserviceDatasets(dataservice.id);
  const swagger = getDataserviceSwagger(dataservice.machine_documentation_url);
  const discussions = getDataserviceDiscussions(dataservice.id);
  const actions = getDataserviceActions(dataservice);
  return (
    <DataserviceDetail
      key={dataservice.id}
      dataservice={dataservice}
      datasets={datasets}
      swagger={swagger}
      discussions={discussions}
      actions={actions}
      locale={locale}
    />
  );
}
