import AboutDadosGovClient from "@/components/documentation/AboutDadosGovClient";
import {
  getAboutDadosGovMetadata,
  getAboutDadosGovPage,
} from "@/service/queries/documentation/about-dadosgov";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await getAboutDadosGovMetadata(locale);

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function AboutDadosGovPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = await getAboutDadosGovPage(locale);

  return <AboutDadosGovClient page={page} />;
}
