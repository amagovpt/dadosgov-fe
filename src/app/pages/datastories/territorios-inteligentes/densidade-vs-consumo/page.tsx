import { InfoBlock } from "@/components/datastories/Components/Shared/InfoBlock";
import Section from "@/components/datastories/Components/Shared/Section";
import { Metadata } from "next";
import { CardCompound } from "@/components/datastories/Components/Shared/CardCompound";
import FooterReference from "@/components/datastories/Components/Shared/FooterReference";
import DataSourcesSection, {
  DataSourcesSectionProps,
} from "@/components/datastories/Components/Shared/DataSourcesSection";

export const metadata: Metadata = {
  title: "Data Story - dados.gov.pt",
};

export default function DataStoryDetailPage() {
  const data = {
    hero: {
      title: "A densidade populacional influencia o consumo doméstico de energia elétrica?",
      description: `A distribuição da população pelo território nacional influencia a forma como se vive e se consome energia em casa. Territórios mais povoados (mais densos) são diferentes de territórios menos povoados (mais dispersos) em termos de habitação, infraestruturas e necessidades de conforto térmico, o que tem um impacto direto no consumo doméstico de eletricidade.
                        \nA densidade populacional mede a intensidade do povoamento, tendo em conta o número de pessoas por quilómetro quadrado. Já o consumo doméstico de energia elétrica mede os quilowatt-hora por habitante, e está associado a fatores como a tipologia e estado dos edifícios, a eficiência energética, as infraestruturas, os equipamentos e o clima.
                        \nA análise conjunta dos dois indicadores, densidade populacional e consumo doméstico de energia elétrica, permite identificar alguns padrões no território. Por exemplo, por norma, regiões mais povoadas consomem menos eletricidade em casa, por oposição a regiões menos povoadas, que tendem a ser mais dispersas, com menor acesso a serviços, e mais expostas a temperaturas extremas.`,
      bigCards: [
        {
          icon: "agora-line-user-group",
          number: "117",
          detail: "hab. / km2",
          subtitle: "Densidade populacional",
          description: "Média nacional",
        },
        {
          icon: "agora-line-user-group",
          number: "4 805",
          detail: "kWh / hab.",
          subtitle: "Consumo doméstico de energia elétrica por habitante",
          description: "Média nacional",
        },
      ],
      period: "2024",
    },
    sections: [
      {
        title: "Como varia a esperança de vida entre sub-regiões?",
        description:
          "Descubra como a densidade populacional e o consumo doméstico de energia elétrica se distribuem pelo país, comparando sub-regiões com perfis distintos e exple de que forma a população influencia o consumo de energia elétrica por habitante.",
        className: "bg-white",
        extraPy: "pt-[64px]",
        iFrame: {
          className:
            "min-[1440px]:!h-[800px] min-[1024px]:!h-[610px] min-[768px]:!h-[470px] min-[425px]:!h-[310px] min-[375px]:!h-[285px] min-[320px]:!h-[285px]",
          src: "https://app.powerbi.com/view?r=eyJrIjoiMzEzODY5ZjktNDQxMy00Mjc3LWIyZjktMjRlYWQ2ZTU1ZGFkIiwidCI6IjVmM2I0YTBjLTBiMWUtNDc3Ni05ZTk1LTY5MzNlNDQwOGU5NyIsImMiOjl9",
        },
      },
      {
        title: "Contrastes municipais em destaque",
        description:
          "Explore como os municípios diferem na densidade populacional e no consumo de energia elétrica, evidenciando contrastes territoriais e a forma como locais mais ou menos povoados influenciam os padrões de consumo.",
        className: "bg-white",
        extraPy: "pt-[64px]",
        iFrame: {
          className:
            "min-[1440px]:!h-[800px] min-[1024px]:!h-[610px] min-[768px]:!h-[470px] min-[425px]:!h-[310px] min-[375px]:!h-[285px] min-[320px]:!h-[285px]",
          src: "https://app.powerbi.com/view?r=eyJrIjoiZDVlZmEzNDktNDgxOC00NWMzLWI1NmEtN2YxYzc0MjEyMGQ5IiwidCI6IjVmM2I0YTBjLTBiMWUtNDc3Ni05ZTk1LTY5MzNlNDQwOGU5NyIsImMiOjl9",
        },
      },
      {
        title:
          "Como varia a densidade populacional e o consumo doméstico de energia elétrica nas sub-regiões?",
        description:
          "Descubra como a densidade populacional e o consumo doméstico de energia elétrica, se distribuem pelo país, comparando sub-regiões com perfis distintos.",
        className: "bg-white",
        extraPy: "pt-[64px]",
        iFrame: {
          className:
            "min-[1440px]:!h-[800px] min-[1024px]:!h-[610px] min-[768px]:!h-[470px] min-[425px]:!h-[310px] min-[375px]:!h-[285px] min-[320px]:!h-[285px]",
          src: "https://app.powerbi.com/view?r=eyJrIjoiOWI0OTQ1N2UtNWE0OC00OWMzLWJiMjAtMGQ1MTU3ZjQyZDI0IiwidCI6IjVmM2I0YTBjLTBiMWUtNDc3Ni05ZTk1LTY5MzNlNDQwOGU5NyIsImMiOjl9",
        },
      },
    ],
    dataSourcesSection: {
      title: "Conjuntos de dados utilizados nesta página",
      description:
        "Os indicadores apresentados usam os seguintes conjuntos de dados, que servem de base aos valores mostrados nesta página.",
      dataSources: [
        {
          children: "Esperança de vida à nascença (anos)",
          href: "https://dados.gov.pt/s/resources/enti-indicador-densidade-populacional-por-local-de-residencia/20260402-020332/enti14-densidade-populacional-local-residencia.csv",
        },
        {
          children: "Esperança de vida após os 65 anos (anos)",
          href: "https://dados.gov.pt/s/resources/enti-indicador-consumo-domestico-de-energia-eletrica-por-habitante-kwh-hab/20260401-020329/enti04-consumo-domestico-energia.csv",
        },
      ],
    },
  };

  return (
    <main className="flex flex-col">
      <Section className="bg-primary-900 flex items-center justify-center ">
        <InfoBlock.Root className="py-[96px]">
          <InfoBlock.Header>
            <InfoBlock.Title
              titleLevel="h1"
              title={data.hero.title}
              className="text-white text-3xl-bold "
            />
          </InfoBlock.Header>
          <InfoBlock.Content className="flex min-[1280px]:flex-row flex-col justify-between min-[1280px]:gap-[136px] gap-32">
            <InfoBlock.Description
              className="whitespace-pre-wrap text-m-regular text-white"
              description={data.hero.description}
            />
            <div className="w-full h-full flex flex-col gap-[128px] py-[44px]">
              <div className="flex flex-col gap-64">
                {data.hero.bigCards.map((card, index) => (
                  <CardCompound.Root key={index}>
                    <CardCompound.Icon icon={card.icon} />
                    <CardCompound.BigNumber number={card.number} detail={card.detail} />
                    <CardCompound.Subtitle>{card.subtitle}</CardCompound.Subtitle>
                    <CardCompound.Description>{card.description}</CardCompound.Description>
                  </CardCompound.Root>
                ))}
              </div>
              <FooterReference text="Ano de referência" period={data.hero.period} />
            </div>
          </InfoBlock.Content>
        </InfoBlock.Root>
      </Section>
      {data.sections.map((section, index) => (
        <Section
          className={"flex flex-col items-center justify-center gap-[64px] " + section.className}
          key={index}
        >
          <InfoBlock.Root className={(section.extraPy ? section.extraPy : "pt-[64px]") + " gap-64"}>
            <InfoBlock.Header className="gap-16">
              <InfoBlock.Title
                titleLevel="h2"
                title={section.title}
                className="text-2xl font-bold text-primary-900"
              />
              <InfoBlock.Description
                className="whitespace-pre-wrap text-m-light text-black max-w-[500px] "
                description={section.description}
              />
            </InfoBlock.Header>
          </InfoBlock.Root>
          <div className="w-full flex flex-col items-center justify-center gap-[128px] pt-[32px]  bg-primary-100">
            <div className="container -mb-[54px]">
              <InfoBlock.IFrame src={section.iFrame.src} className={section.iFrame.className} />
            </div>
          </div>
        </Section>
      ))}
      <DataSourcesSection {...(data.dataSourcesSection as DataSourcesSectionProps)} />
    </main>
  );
}
