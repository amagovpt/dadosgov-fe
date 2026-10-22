import { Metadata } from "next";
import {
  getDatastorySearchPage,
} from "@/service/queries/datastories/datastory";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const datastorySlug = "prr/beneficiarios-do-prr";

  const { hero } = await getDatastorySearchPage(datastorySlug, locale);

  return {
    title: hero.title,
    description: hero.description,
  };
}

export default async function DataStoryBeneficiariesPT2030({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {

  return (
    <main className="datastory-page flex flex-col">

    </main>
  );
}
