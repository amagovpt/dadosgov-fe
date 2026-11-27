import { Metadata } from "next";
import {
  DimensionPrrPage,
  generateDimensionMetadata,
} from "@/components/datastories/DimensionPrr/DimensionPrrPage";
import { CLIMATE_TRANSITION_DIMENSION } from "@/lib/prr/dimensions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateDimensionMetadata(CLIMATE_TRANSITION_DIMENSION, locale);
}

export default async function DataStoryClimateTransitionDimensionPRR({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <DimensionPrrPage config={CLIMATE_TRANSITION_DIMENSION} locale={locale} />;
}
