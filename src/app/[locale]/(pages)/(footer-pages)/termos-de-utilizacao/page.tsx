import Breadcrumb from "@/components/Primitives/Breadcrumb/Breadcrumb";
import { getFaqs } from "@/service/queries/faqs/faqs";

import { Metadata } from "next";
import MarkDownRender from "@/components/Shared/MarkDownRender";
import initTranslations from "@/app/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  {
    //params,
  }: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  try {
    const { title } = await getFaqs("termos-de-utilizacao", "pt");
    return { title };
  } catch (error) {
    // Fall back to the layout's default title rather than failing the whole
    // page render when the CMS is unreachable.
    console.error("Error fetching termos-de-utilizacao metadata:", error);
    return {};
  }
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { title, body } = await getFaqs("termos-de-utilizacao", "pt");
  const { t } = await initTranslations({ locale, namespaces: ["common"], });

  return (
    <main className="flex flex-col pt-32 pb-64 bg-white gap-64 justify-center items-center w-full h-full">
      <div className="container ">
        <Breadcrumb items={[
          { label: t("home"), url: "/" },
          { label: title, url: "/termos-de-utilizacao" },
        ]} />
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
