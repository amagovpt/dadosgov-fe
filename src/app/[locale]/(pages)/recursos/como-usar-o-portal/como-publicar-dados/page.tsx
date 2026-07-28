import BreadcrumbDynamic from "@/components/Shared/BreadcrumbDynamic";
import { getFaqs } from "@/service/queries/faqs/faqs";
import { Metadata } from "next";
import MarkDownRender from "@/components/Shared/MarkDownRender";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  {
    //params,
  }: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  const { title } = await getFaqs("como-publicar-dados", "pt");

  return {
    title,
  };
}
export default async function PublishFaqPage() {
  const { body } = await getFaqs("como-publicar-dados", "pt");

  return (
    <main className="flex flex-col pt-32 pb-64 bg-white gap-64 justify-center items-center w-full h-full">
      <div className="container ">
        <BreadcrumbDynamic darkMode={false} />
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
