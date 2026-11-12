import { Metadata } from "next";
import { notFound } from "next/navigation";
import { UserGuideDetailClient } from "@/components/user-guides/UserGuideDetailClient";
import { getUserGuide, getUserGuideMetadata } from "@/service/queries/user-guides";
import { stripHtmlTags } from "@/utils/htmlToParagraphs";

type UserGuideParams = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: UserGuideParams }): Promise<Metadata> {
  const { locale, slug } = await params;
  const metadata = await getUserGuideMetadata(slug, locale);
  if (!metadata?.title) return {};

  return {
    title: `${metadata.title}`,
    description: stripHtmlTags(metadata.description),
  };
}

export default async function UserGuidePage({ params }: { params: UserGuideParams }) {
  const { locale, slug } = await params;
  const guide = await getUserGuide(slug, locale);
  if (!guide) notFound();

  return <UserGuideDetailClient guide={guide} />;
}
