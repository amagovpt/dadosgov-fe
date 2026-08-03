import BreadcrumbDynamic from "@/components/Shared/BreadcrumbDynamic";
import { getFaqs } from "@/service/queries/faqs/faqs";

import { Metadata } from "next";
import MarkDownRender from "@/components/Shared/MarkDownRender";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  {
    params,
  }: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  const { locale } = await params;
  const { title } = await getFaqs("termos-de-utilizacao", locale);

  return {
    title,
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { title, body } = await getFaqs("termos-de-utilizacao", locale);

  return (
    <main className="flex flex-col pt-32 pb-64 bg-white gap-64 justify-center items-center w-full h-full">
      <div className="container ">
        <BreadcrumbDynamic darkMode={false} currentLabel={title} />
      </div>

      <div className="bg-neutral-100 flex flex-col items-center justify-center py-64 w-full h-full">
        <div className="container">
          <div className="max-w-[592px]">
            {body ? (
              <div className="text-neutral-900 flex flex-col gap-16">
                <MarkDownRender body={body} />
              </div>
            ) : (
              <p className="text-m-regular leading-7 text-[#2b363c]">
                Não foi possível carregar o conteúdo.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
