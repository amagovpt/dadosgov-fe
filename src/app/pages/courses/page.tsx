import CardGeneral from "@/components/Cards/CardGeneral";
import HeroCourses from "@/components/Courses/Hero";
import Button from "@/components/Primitives/Button";

export default function page() {
  return (
    <main className="w-full h-full">
      <HeroCourses />
      <section className="bg-secondary-700 py-64 flex items-center justify-center">
        <div className="container flex flex-col items-center justify-center gap-[32px]">
          <div className="w-full text-white flex flex-col gap-16">
            <h2 className="font-bold text-[24px] ">
              Mini Cursos
            </h2>
            <span>
              Formações curtas, práticas e de acesso livre, pensadas para uma aprendizagem rápida.
            </span>
          </div>
          <div className="w-full h-full grid gap-[32px] grid-cols-12">
            <div className="col-span-12 min-[1024px]:col-span-4 bg-wihte">
              <CardGeneral {
                ...{
                  titleText: "Introdução à Análise de Dados",
                  descriptionText: "Aprenda os fundamentos da análise de dados, incluindo coleta, limpeza e visualização de dados.",
                  subtitleText: "Iniciante",
                  imageIndent: true,
                  image: {
                    src: "/card-full-image.png",
                    alt: "Introdução à Análise de Dados"
                  }
                }
              } />
            </div>
            <div className="col-span-12 min-[1024px]:col-span-4 bg-wihte">
              <CardGeneral {
                ...{
                  titleText: "Introdução à Análise de Dados",
                  descriptionText: "Aprenda os fundamentos da análise de dados, incluindo coleta, limpeza e visualização de dados.",
                  subtitleText: "Iniciante",
                  imageIndent: true,
                  image: {
                    src: "/card-full-image.png",
                    alt: "Introdução à Análise de Dados"
                  }
                }
              } />
            </div>
            <div className="col-span-12 min-[1024px]:col-span-4 bg-wihte">
              <CardGeneral {
                ...{
                  titleText: "Introdução à Análise de Dados",
                  descriptionText: "Aprenda os fundamentos da análise de dados, incluindo coleta, limpeza e visualização de dados.",
                  subtitleText: "Iniciante",
                  imageIndent: true,
                  image: {
                    src: "/card-full-image.png",
                    alt: "Introdução à Análise de Dados"
                  }
                }
              } />
            </div>
          </div>
          <div className="w-full ">
            <Button variant="primary" appearance="link" className="!text-white" trailingIcon="agora-line-arrow-right-circle" trailingIconHover="agora-solid-arrow-right-circle" hasIcon={true}>
              Ver mais mini cursos
            </Button>
          </div>
        </div>
      </section>
      <section className="pt-64 flex items-center justify-center">
        <div className="container flex flex-col items-center justify-center">
          <div className="w-full text-primary-900 flex flex-col gap-16">
            <h2 className="font-bold text-[24px] ">
              Outros cursos recomendados
            </h2>
            <div>
              <span>
                Formações certificadas que permitem desenvolver competências digitais de forma aprofundada
              </span>
              <div className="w-full bg-neutral-200 h-[2px] mt-[12px]" />
            </div>
          </div>
          <div className="w-full h-full grid gap-[32px] grid-cols-12 py-[32px]">
            <div className="col-span-12 min-[1024px]:col-span-4 bg-wihte">
              <CardGeneral {
                ...{
                  titleText: "Introdução à Análise de Dados",
                  descriptionText: "Aprenda os fundamentos da análise de dados, incluindo coleta, limpeza e visualização de dados.",
                  subtitleText: "Iniciante",
                }
              } />
            </div>
            <div className="col-span-12 min-[1024px]:col-span-4 bg-wihte">
              <CardGeneral {
                ...{
                  titleText: "Introdução à Análise de Dados",
                  descriptionText: "Aprenda os fundamentos da análise de dados, incluindo coleta, limpeza e visualização de dados.",
                  subtitleText: "Iniciante",
                }
              } />
            </div>
            <div className="col-span-12 min-[1024px]:col-span-4 bg-wihte">
              <CardGeneral {
                ...{
                  titleText: "Introdução à Análise de Dados",
                  descriptionText: "Aprenda os fundamentos da análise de dados, incluindo coleta, limpeza e visualização de dados.",
                  subtitleText: "Iniciante",
                }
              } />
            </div>
          </div>
        </div>

      </section>
    </main>
  )
}
