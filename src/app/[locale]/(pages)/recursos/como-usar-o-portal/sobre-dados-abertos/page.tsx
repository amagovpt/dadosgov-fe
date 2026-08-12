import AboutOpenData from "@/components/articles/AboutOpenData";
import { Metadata } from "next";
import {
  getAboutOpenDataMetadata,
  getAboutOpenDataPage,
} from "@/service/queries/documentation/about-open-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getAboutOpenDataMetadata(locale);

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function AboutOpenDataPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = await getAboutOpenDataPage(locale);
  return <AboutOpenData page={page} />;
}
