import { InfoBlock } from "@/components/Shared/InfoBlock";
import Section from "@/components/Shared/Section";
import { Metadata } from "next";
import { CardCompound } from "@/components/Shared/CardCompound";
import FooterReference from "@/components/Shared/FooterReference";
import DataSourcesSection, {
  DataSourcesSectionProps,
} from "@/components/Shared/DataSourcesSection";

export const metadata: Metadata = {
  title: "Data Story - dados.gov.pt",
};

export default function DataStoryDetailPage() {
  const data = {
    hero: {
      title: "Esperança de vida em Portugal: evolução e diferenças no território",
      description: `A esperança de vida da população em Portugal pode ser analisada a partir de dois indicadores relevantes: a esperança de vida à nascença e a esperança de vida aos 65 anos. Ambos contribuem para compreender as condições de vida da população e a evolução do bem-estar ao longo do tempo, sendo calculados com base em períodos de referência de três anos consecutivos.
                        \nA esperança de vida à nascença representa o número médio de anos que uma pessoa pode esperar viver, com base nas taxas de mortalidade do período em análise. Já a esperança de vida após os 65 anos corresponde ao número médio de anos adicionais que uma pessoa pode esperar viver a partir dessa idade, considerando essas mesmas taxas de mortalidade do mesmo período.
                        \nA leitura conjunta destes dois indicadores permite analisar a previsão da esperança de vida  da população, a sua evolução ao longo do tempo e como se distribui pelo país, revelando diferenças visíveis em todo o território.`,
      bigCards: [
        {
          icon: "agora-line-user",
          number: "81,5",
          detail: "anos",
          subtitle: "Esperança de vida à nascença",
          description: "Valor médio nacional",
        },
        {
          icon: "agora-line-user-group",
          number: "85",
          detail: "anos",
          subtitle: "Esperança de vida após os 65 anos",
          description: "Valor médio nacional",
        },
      ],
      period: "2022 - 2024",
    },
    sections: [
      {
        title: "Como varia a esperança de vida entre sub-regiões?",
        description:
          "Explore como estes indicadores se distribuem pelas diferentes sub-regiões do país. A análise territorial ajuda a identificar padrões regionais e a perceber como a esperança de vida e o envelhecimento podem diferir consoante as características dos territórios.",
        className: "bg-white",
        extraPy: "pt-[64px]",
        iFrame: {
          className:
            "min-[1440px]:!h-[800px] min-[1024px]:!h-[610px] min-[768px]:!h-[470px] min-[425px]:!h-[310px] min-[375px]:!h-[285px] min-[320px]:!h-[285px]",
          src: "https://app.powerbi.com/view?r=eyJrIjoiZjRlMjg2MjQtNzJkOS00MGM4LWExNmYtMmJhOTc3NDA2YTQ4IiwidCI6IjVmM2I0YTBjLTBiMWUtNDc3Ni05ZTk1LTY5MzNlNDQwOGU5NyIsImMiOjl9",
        },
      },
      {
        title: "Como evolui a esperança de vida ao longo do tempo?",
        description:
          "Acompanhe a evolução da esperança de vida à nascença e após os 65 anos, e observe como estes indicadores ajudam a compreender as mudanças na esperança de vida da população.",
        className: "bg-white",
        extraPy: "pt-[64px]",
        iFrame: {
          className:
            "min-[1440px]:!h-[800px] min-[1024px]:!h-[610px] min-[768px]:!h-[470px] min-[425px]:!h-[310px] min-[375px]:!h-[285px] min-[320px]:!h-[285px]",
          src: "https://app.powerbi.com/view?r=eyJrIjoiYzg0ZWE3ZWEtZmM4ZC00NmYxLTlmMTQtZTU4OWM3ZGM5MWIwIiwidCI6IjVmM2I0YTBjLTBiMWUtNDc3Ni05ZTk1LTY5MzNlNDQwOGU5NyIsImMiOjl9",
        },
      },
      {
        title: "Que sub-regiões registam maior esperança de vida?",
        description:
          "Descubra quais são as sub-regiões que registam os valores mais elevados de esperança de vida à nascença e após os 65 anos, nos diferentes períodos.",
        className: "bg-white",
        extraPy: "pt-[64px]",
        iFrame: {
          className:
            "min-[1440px]:!h-[800px] min-[1024px]:!h-[610px] min-[768px]:!h-[470px] min-[425px]:!h-[310px] min-[375px]:!h-[285px] min-[320px]:!h-[285px]",
          src: "https://app.powerbi.com/view?r=eyJrIjoiMjZhN2Y5NjctZTJlNC00NzNmLWE2NmMtMTQ1ODUzMTBhYzk4IiwidCI6IjVmM2I0YTBjLTBiMWUtNDc3Ni05ZTk1LTY5MzNlNDQwOGU5NyIsImMiOjl9",
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
          href: "https://dados.gov.pt/s/resources/enti-indicador-esperanca-de-vida-a-nascenca/20260404-060334/enti48-esperanca-vida-nascenca.csv",
        },
        {
          children: "Esperança de vida após os 65 anos (anos)",
          href: "https://dados.gov.pt/s/resources/enti-indicador-esperanca-de-vida-aos-65-anos/20260404-060333/enti48-esperanca-vida-65-anos.csv",
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
              <FooterReference text="Período de referência" period={data.hero.period} />
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
            <div className="container -mb-[54px] ">
              <InfoBlock.IFrame src={section.iFrame.src} className={section.iFrame.className} />
            </div>
          </div>
        </Section>
      ))}
      <DataSourcesSection {...(data.dataSourcesSection as DataSourcesSectionProps)} />
    </main>
  );
}
