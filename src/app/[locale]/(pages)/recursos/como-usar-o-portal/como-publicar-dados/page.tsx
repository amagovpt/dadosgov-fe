import Breadcrumb from "@/components/Primitives/Breadcrumb/Breadcrumb";
import { getFaqs } from "@/service/queries/faqs/faqs";
import { Metadata } from "next";
import initTranslations from "@/app/i18n";
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
export default async function PublishFaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { body } = await getFaqs("como-publicar-dados", "pt");
  const { t } = await initTranslations({ locale, namespaces: ["common"], });



  return (
    <main className="flex flex-col pt-32 pb-64 bg-white gap-64 justify-center items-center w-full h-full">
      <div className="container ">
        <Breadcrumb items={[
          { label: t("home"), url: "/" },
          { label: t("recursos"), url: "/recursos" },
          { label: t("como-usar-o-portal"), url: "/recursos/como-usar-o-portal" },
          { label: "Como publicar dados", url: "/recursos/como-usar-o-portal/como-publicar-dados" },

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
