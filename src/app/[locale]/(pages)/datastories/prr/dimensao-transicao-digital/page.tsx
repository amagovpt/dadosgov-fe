import { Metadata } from "next";
import {
  DimensionPrrPage,
  generateDimensionMetadata,
} from "@/components/datastories/DimensionPrr/DimensionPrrPage";
import { DIGITAL_TRANSITION_DIMENSION } from "@/lib/prr/dimensions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateDimensionMetadata(DIGITAL_TRANSITION_DIMENSION, locale);
}

export default async function DataStoryDigitalTransitionDimensionPRR({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <DimensionPrrPage config={DIGITAL_TRANSITION_DIMENSION} locale={locale} />;
}
