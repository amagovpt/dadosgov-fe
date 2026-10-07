import { Metadata } from "next";
import { getDatastory, getDatastoryMetadata } from "@/service/queries/datastories/datastory";
import { Datastory } from "@/components/Shared/Datastories";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const datastorySlug = "portugal-2030/beneficiarios-do-portugal-2030";
  const datastory = await getDatastoryMetadata(datastorySlug, locale);

  return {
    title: datastory.title,
    description: datastory.description,
  };
}

export default async function DataStoryDetailPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const datastorySlug = "portugal-2030/beneficiarios-do-portugal-2030";
  const datastory = await getDatastory(datastorySlug, locale);

  return (
    <main className="flex flex-col datastory-page">
      {/* hero section with index */}
      <Datastory.Hero {...datastory.hero} />
    </main>
  );
}
