import CardGeneral from "@/components/Cards/CardGeneral";
import HeroCourses from "@/components/Courses/Hero";
import Button from "@/components/Primitives/Button";

export default function page() {
  return (
    <main className="w-full h-full">
      <HeroCourses />
      <section className="bg-secondary-700 py-64 flex items-center justify-center">
        <div className="container flex flex-col items-center justify-center gap-32">
          <div className="w-full text-white flex flex-col gap-16">
            <h2 className="text-xl-bold">
              Mini Cursos
            </h2>
            <span>
              Formações curtas, práticas e de acesso livre, pensadas para uma aprendizagem rápida.
            </span>
          </div>
          <div className="w-full h-full grid gap-32 grid-cols-12">
            <div className="col-span-12 lg:col-span-4 bg-wihte">
              <CardGeneral {
                ...{
                  titleText: "Introdução à Análise de Dados",
                  descriptionText: "Aprenda os fundamentos da análise de dados, incluindo coleta, limpeza e visualização de dados.",
                  subtitleText: "Publicado: ",
                  imageIndent: true,
                  image: {
                    src: "/card-full-image.png",
                    alt: "Introdução à Análise de Dados"
                  }
                }
              } />
            </div>
            <div className="col-span-12 lg:col-span-4 bg-wihte">
              <CardGeneral {
                ...{
                  titleText: "Introdução à Análise de Dados",
                  descriptionText: "Aprenda os fundamentos da análise de dados, incluindo coleta, limpeza e visualização de dados.",
                  subtitleText: "Publicado: ",
                  imageIndent: true,
                  image: {
                    src: "/card-full-image.png",
                    alt: "Introdução à Análise de Dados"
                  }
                }
              } />
            </div>
            <div className="col-span-12 lg:col-span-4 bg-wihte">
              <CardGeneral {
                ...{
                  titleText: "Introdução à Análise de Dados",
                  descriptionText: "Aprenda os fundamentos da análise de dados, incluindo coleta, limpeza e visualização de dados.",
                  subtitleText: "Publicado: ",
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
            <Button variant="primary" appearance="link" className="!text-white [&_.icon]:hover:!fill-white [&_.icon]:!fill-white hover:!decoration-white" trailingIcon="agora-line-arrow-right-circle" trailingIconHover="agora-solid-arrow-right-circle" hasIcon={true}>
              Ver mais mini cursos
            </Button>
          </div>
        </div>
      </section>
      <section className="pt-64 flex items-center justify-center">
        <div className="container flex flex-col items-center justify-center">
          <div className="w-full text-primary-900 flex flex-col gap-16">
            <h2 className="text-xl-bold">
              Outros cursos recomendados
            </h2>
            <div>
              <span>
                Formações certificadas que permitem desenvolver competências digitais de forma aprofundada
              </span>
              <div className="w-full bg-neutral-200 h-2 mt-12" />
            </div>
          </div>
          <div className="w-full h-full grid gap-32 grid-cols-12 py-32">
            <div className="col-span-12 lg:col-span-4 bg-wihte">
              <CardGeneral {
                ...{
                  titleText: "Introdução à Análise de Dados",
                  descriptionText: "Aprenda os fundamentos da análise de dados, incluindo coleta, limpeza e visualização de dados.",
                  subtitleText: "Iniciante",
                }
              } />
            </div>
            <div className="col-span-12 lg:col-span-4 bg-wihte">
              <CardGeneral {
                ...{
                  titleText: "Introdução à Análise de Dados",
                  descriptionText: "Aprenda os fundamentos da análise de dados, incluindo coleta, limpeza e visualização de dados.",
                  subtitleText: "Iniciante",
                }
              } />
            </div>
            <div className="col-span-12 lg:col-span-4 bg-wihte">
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
