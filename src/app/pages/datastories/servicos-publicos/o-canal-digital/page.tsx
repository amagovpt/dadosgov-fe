import { CardCompound } from '@/components/Shared/CardCompound';
import DataSourcesSection, { DataSourcesSectionProps } from '@/components/Shared/DataSourcesSection';
import { InfoBlock } from '@/components/Shared/InfoBlock';
import Section from '@/components/Shared/Section';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Data Story - dados.gov.pt',
};

export default function DataStoryDetailPage() {

    const data = {
        hero: {
            title: 'Serviços Públicos: o canal digital',
            description: `Para garantir a proximidade com a população e garantir que os cidadãos podem escolher a forma mais conveniente de interagir com o Estado, a Agência para a Reforma Tecnológica do Estado (ARTE) organiza o seu atendimento público em 3 canais: presencial, online e telefone.
                        \nO canal digital tem ganho cada vez mais relevância na prestação de serviços públicos. Através do Portal e da app gov.pt, os cidadãos podem aceder a um conjunto alargado de serviços e realizar procedimentos administrativos sem necessidade de deslocação.
                        \nNesta história assente em dados, exploramos como funciona o canal digital: quais os serviços mais utilizados, como evoluiu a sua adoção ao longo do tempo, e de que forma contribui para a modernização da Administração Pública portuguesa.`,
            bigCards: [
                {
                    icon: 'agora-line-ticket',
                    title: "Canal presencial",
                    description: "Lojas e Espaços do Cidadão",
                    anchor: {
                        href: "/pages/datastories/servicos-publicos/o-canal-presencial",
                        children: "Serviços públicos: o canal presencial"
                    }
                },
                {
                    icon: 'agora-line-help-support',
                    title: "Canal telefónico",
                    description: "Linha Cidadão",
                    anchor: {
                        href: "#",
                        children: "Serviços públicos: o canal telefónico"
                    }
                },
                {
                    icon: 'agora-line-smartphone',
                    title: "Canal digital",
                    description: "Portal e app gov.pt",
                },
            ],
        },
        sections: [{
            title: 'Como evoluiu a utilização do canal digital?',
            description: "Observe a evolução do número de acessos e transações realizadas através do Portal gov.pt ao longo do tempo.",
            className: 'bg-primary-100',
            extraPy: 'py-[64px]',
            iFrame: {
                className: 'min-[1440px]:!h-[1130px] min-[1024px]:!h-[860px] min-[768px]:!h-[645px] min-[425px]:!h-[410px] min-[375px]:!h-[390px] min-[320px]:!h-[390px]',
                src: '#',
            },
        }, {
            title: 'Quais os serviços digitais mais utilizados?',
            description: "Descubra quais os serviços disponíveis no canal digital com maior adesão por parte dos cidadãos.",
            className: 'bg-primary-100',
            extraPy: 'pt-[64px]',
            iFrame: {
                className: 'min-[1440px]:!h-[1080px] min-[1024px]:!h-[825px] min-[768px]:!h-[620px] min-[425px]:!h-[396px] min-[375px]:!h-[355px] min-[320px]:!h-[350px]',
                src: '#',
            },
        },
        {
            title: 'Como se distribuem os utilizadores pelo território?',
            description: "Analise a distribuição geográfica da utilização do canal digital em Portugal.",
            className: 'bg-primary-100',
            extraPy: 'pt-[64px]',
            iFrame: {
                className: 'min-[1440px]:!h-[1250px] min-[1024px]:!h-[950px] min-[768px]:!h-[710px] min-[425px]:!h-[446px] min-[375px]:!h-[400px] min-[320px]:!h-[400px]',
                src: '#',
            },
        }],
        dataSourcesSection: {
            title: 'Datasets utilizados nesta página',
            description: 'Os indicadores apresentados usam os seguintes datasets, que servem de base aos valores mostrados nesta página.',
            dataSources: [{
                children: "Utilização do canal digital gov.pt",
                href: "#",
            }]
        }
    };

    return (
        <main className='flex flex-col'>
            <Section className="bg-primary-900 flex items-center justify-center ">
                <InfoBlock.Root className='py-[96px]'>
                    <InfoBlock.Header>
                        <InfoBlock.Title titleLevel="h1" title={data.hero.title} className='text-white text-3xl-bold ' />
                    </InfoBlock.Header>
                    <InfoBlock.Content className='flex min-[1280px]:flex-row flex-col justify-between min-[1280px]:gap-[136px] gap-32 '>
                        <InfoBlock.Description className='whitespace-pre-wrap text-m-regular text-white' description={data.hero.description} />
                        <div className='w-full h-full flex flex-col gap-[128px] justify-center'>
                            <div className='flex flex-col gap-64'>
                                {data.hero.bigCards.map((card, index) => (
                                    <CardCompound.Root className='gap-8' key={index}>
                                        <CardCompound.Icon icon={card.icon} />
                                        <div className='flex flex-col'>
                                            <CardCompound.Title>
                                                {card.title}
                                            </CardCompound.Title>
                                            <CardCompound.Description>
                                                {card.description}
                                            </CardCompound.Description>
                                        </div>
                                        {card.anchor && (
                                            <CardCompound.Anchor variant='primary' appearance='link' href={card.anchor.href} className='hover:!text-white ' hasIcon>
                                                {card.anchor.children}
                                            </CardCompound.Anchor>
                                        )}
                                    </CardCompound.Root>
                                ))}
                            </div>
                        </div>
                    </InfoBlock.Content>
                </InfoBlock.Root>
            </Section>
            {data.sections.map((section, index) => (
                <Section className={"flex items-center justify-center " + section.className} key={index}>
                    <InfoBlock.Root className={(section.extraPy ? section.extraPy : 'pt-[64px]') + ' gap-64'}>
                        <InfoBlock.Header className='gap-16'>
                            <InfoBlock.Title titleLevel="h2" title={section.title} className='text-2xl font-bold text-primary-900' />
                            <InfoBlock.Description className=' whitespace-pre-wrap text-m-light text-black max-w-[500px] ' description={section.description} />
                        </InfoBlock.Header>
                        <InfoBlock.IFrame
                            src={section.iFrame.src}
                            className={section.iFrame.className}
                        />
                    </InfoBlock.Root>
                </Section>
            ))}
            <DataSourcesSection {...data.dataSourcesSection as DataSourcesSectionProps} className='mt-[96px]' />
        </main>
    );
}
