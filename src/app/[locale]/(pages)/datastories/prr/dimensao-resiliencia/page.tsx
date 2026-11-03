import { Metadata } from "next";
import {
  DimensionPrrPage,
  generateDimensionMetadata,
} from "@/components/datastories/DimensionPrr/DimensionPrrPage";
import { RESILIENCE_DIMENSION } from "@/lib/prr/dimensions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateDimensionMetadata(RESILIENCE_DIMENSION, locale);
}

export default async function DataStoryResilienceDimensionPRR({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <DimensionPrrPage config={RESILIENCE_DIMENSION} locale={locale} />;
}
