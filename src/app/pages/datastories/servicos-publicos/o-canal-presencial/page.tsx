import { CardCompound } from '@/components/datastories/Components/Shared/CardCompound';
import DataSourcesSection, { DataSourcesSectionProps } from '@/components/datastories/Components/Shared/DataSourcesSection';
import { InfoBlock } from '@/components/datastories/Components/Shared/InfoBlock';
import Section from '@/components/datastories/Components/Shared/Section';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Data Story - dados.gov.pt',
};

export default function DataStoryDetailPage() {

    const data = {
        hero: {
            title: 'Serviços Públicos: o canal presencial',
            description: `Para garantir a proximidade com a população e garantir que os cidadãos podem escolher a forma mais conveniente de interagir com o Estado, a Agência para a Reforma Tecnológica do Estado (ARTE) organiza o seu atendimento público em 3 canais: presencial, online e telefone.
                        \nO canal presencial continua a ser um dos mais utilizados. Várias entidades públicas concentram os seus serviços nas Lojas e Espaços Cidadão, permitindo à população resolver diferentes assuntos numa única deslocação – seja renovar documentos de identificação, tratar de temas relacionados com a Segurança Social, entre outros.
                        \nNesta história assente em dados, exploramos como funciona o canal presencial: onde se localizam os locais de atendimento, quais os locais de atendimento e os serviços mais procurados, e quanto tempo demora a realização de um serviço. Compreender o funcionamento do canal presencial ajuda a perceber como os serviços públicos chegam às pessoas e que mudanças podem ser feitas para o tornar mais eficaz.`,
            bigCards: [
                {
                    icon: 'agora-line-ticket',
                    title: "Canal presencial",
                    description: "Lojas e Espaços do Cidadão",
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
                    anchor: {
                        href: "#",
                        children: "Serviços públicos: o canal digital"
                    }
                },
            ],
        },
        sections: [{
            title: 'Onde estão as Lojas e Espaços Cidadão?',
            description: "Veja como é que os locais de atendimento presenciais se distribuem pelo território para satisfazer as necessidades da população.",
            className: 'bg-primary-100',
            extraPy: 'py-[64px]',
            iFrame: {
                className: 'min-[1440px]:!h-[1130px] min-[1024px]:!h-[860px] min-[768px]:!h-[645px] min-[425px]:!h-[410px] min-[375px]:!h-[390px] min-[320px]:!h-[390px]',
                src: 'https://app.powerbi.com/view?r=eyJrIjoiYzJkYTIyZTAtMzU4Yy00YWFiLWEzMDgtZThhOTBlYjkyYmM5IiwidCI6IjVmM2I0YTBjLTBiMWUtNDc3Ni05ZTk1LTY5MzNlNDQwOGU5NyIsImMiOjl9',
            },
        }, {
            title: 'A eficiência do canal presencial',
            description: "O atendimento mede as interações entre o cidadão e as instituições públicas e privadas presentes nas Lojas e Espaços Cidadão. Compreenda a evolução da eficiência dos serviços públicos presenciais, analisando a relação entre o número de senhas tiradas e o número de atendimentos realizados.",
            className: 'bg-primary-100',
            extraPy: 'pt-[64px]',
            iFrame: {
                className: 'min-[1440px]:!h-[1080px] min-[1024px]:!h-[825px] min-[768px]:!h-[620px] min-[425px]:!h-[396px] min-[375px]:!h-[355px] min-[320px]:!h-[350px]',
                src: 'https://app.powerbi.com/view?r=eyJrIjoiZmZiZjM4YjYtOWRmMS00OWQ4LWEyNGMtZGJhYzkwNDY1MmI5IiwidCI6IjVmM2I0YTBjLTBiMWUtNDc3Ni05ZTk1LTY5MzNlNDQwOGU5NyIsImMiOjl9',
            },
        },
        {
            title: 'Para onde se dirigem os cidadãos?',
            description: "Descubra quais as Lojas e Espaços de Cidadão com maior e menor afluência.",
            className: 'bg-primary-100',
            extraPy: 'pt-[64px]',
            iFrame: {
                className: 'min-[1440px]:!h-[1250px] min-[1024px]:!h-[950px] min-[768px]:!h-[710px] min-[425px]:!h-[446px] min-[375px]:!h-[400px] min-[320px]:!h-[400px]',
                src: 'https://app.powerbi.com/view?r=eyJrIjoiYzhiNGNmNmUtOGIzZi00OGU2LWI0ZGYtNGNhM2FkZGYzYWMzIiwidCI6IjVmM2I0YTBjLTBiMWUtNDc3Ni05ZTk1LTY5MzNlNDQwOGU5NyIsImMiOjl9',
            },
        },
        {
            title: 'E o que procuram?',
            description: "Saiba quais os serviços mais e menos procurados nas Lojas de Cidadão.",
            className: 'bg-primary-100',
            extraPy: 'pt-[64px]',
            iFrame: {
                className: 'min-[1440px]:!h-[1250px] min-[1024px]:!h-[950px] min-[768px]:!h-[710px] min-[425px]:!h-[446px] min-[375px]:!h-[400px] min-[320px]:!h-[400px]',
                src: 'https://app.powerbi.com/view?r=eyJrIjoiYzBjYzFlY2QtYTdkZC00OWVjLThkODgtOTcyMzE1MjgxMWQ4IiwidCI6IjVmM2I0YTBjLTBiMWUtNDc3Ni05ZTk1LTY5MzNlNDQwOGU5NyIsImMiOjl9',
            },
        },
        {
            title: 'Quanto tempo espera o cidadão?',
            description: "Os tempos de espera e de atendimento variam entre locais de atendimento e dependem do serviço realizado e da entidade que presta o serviço.",
            className: 'bg-primary-100',
            extraPy: 'py-[64px]',
            iFrame: {
                className: 'min-[1440px]:!h-[860px] min-[1024px]:!h-[662px] min-[768px]:!h-[505px] min-[425px]:!h-[332px] min-[375px]:!h-[300px] min-[320px]:!h-[380px]',
                src: 'https://app.powerbi.com/view?r=eyJrIjoiZWZmM2NiODItYTU0OC00YmU1LWI0M2QtMTUzNmRjODc0YmY2IiwidCI6IjVmM2I0YTBjLTBiMWUtNDc3Ni05ZTk1LTY5MzNlNDQwOGU5NyIsImMiOjl9',
            },
        }],
        dataSourcesSection: {
            title: 'Datasets utilizados nesta página',
            description: 'Os indicadores apresentados usam os seguintes datasets, que servem de base aos valores mostrados nesta página.',
            dataSources: [{
                children: "Atentimento do canal presencial",
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
