import { Accordion } from '@/components/Shared/Accordion';
import Anchor from '@/components/Shared/Anchor';
import { Typograph } from '@/components/Shared/Generics/Typograph';
import Hero from '@/components/Shared/Hero';
import SimpleSiteMap from '@/components/Shared/SiteMap/SimpleSiteMap'
import { Table } from '@/components/Shared/Table';
import { getRoadmapPage } from '@/service/queries/roadmap';
import { parseHtmlToParagraphs } from '@/utils/htmlToParagraphs';
import ReactMarkdown from 'react-markdown';

export const dynamic = "force-dynamic";

export default async function page() {

    const { hero,
        sitemap,
        visionAndPriorities,
        keyEvolution,
        keyEvolutionPlanned,
        howWePrioritize,
        followAlongAndJoinIn,
        history,
        historyOfDevelopment,
    } = await getRoadmapPage("pt");

    const tableHeaders = [
        "Funcionalidade",
        "Descrição",
        "Estado",
    ];


    return (
        <main className="w-full h-full flex flex-col items-center justify-center ">
            <Hero
                title={hero.title}
                description={parseHtmlToParagraphs(hero.description)}
                breadcrumbItems={[
                    { label: 'Home', url: '/' },
                    { label: 'Roteiro para dados.gov.pt', url: '#' },
                ]}
            />
            <div className="container grid grid-cols-12 gap-32 py-64 roadmap-page">
                <div className="md:col-span-3 hidden md:block">
                    <SimpleSiteMap
                        title={sitemap.title}
                        anchor={sitemap.links.map(anchor => ({
                            children: anchor.children,
                            href: anchor.href,
                        }))}
                    />
                </div>
                <div className="col-span-12 md:col-span-9 flex flex-col gap-64 pl-32 border-l-2 border-neutral-200 h-full">
                    <div className='w-full flex flex-col gap-24' id={visionAndPriorities.id}>
                        <Typograph tag='h2' className='text-xl-bold text-primary-900'>
                            {visionAndPriorities.title}
                        </Typograph>
                        <div className='roadmap-block'>
                            <ReactMarkdown>
                                {visionAndPriorities.description}
                            </ReactMarkdown>
                        </div>
                    </div>
                    <div className='w-full flex flex-col gap-24' id={keyEvolution.id}>
                        <Typograph tag='h2' className='text-xl-bold text-primary-900'>
                            {keyEvolution.title}
                        </Typograph>

                        <Table.Root>
                            <Table.Header>
                                <Table.Row>
                                    {tableHeaders.map((header, index) => (
                                        <Table.HeaderCell key={index} className='w-1/3 [&_.table-header-cell]:!w-full'>{header}</Table.HeaderCell>
                                    ))}
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {keyEvolutionPlanned.map((evolution, index) => (
                                    <Table.Row key={index}>
                                        <Table.Cell headerLabel={tableHeaders[0]}>{evolution.functionality}</Table.Cell>
                                        <Table.Cell headerLabel={tableHeaders[1]}>{evolution.description}</Table.Cell>
                                        <Table.Cell headerLabel={tableHeaders[2]} >{evolution.state === "finished" ?
                                            (<span className="flex gap-8 items-center justify-start">
                                                <div className="w-8 h-8 bg-success-600 rounded-full" />
                                                <div className="text-m-regular">
                                                    Concluído
                                                </div>
                                            </span>) : evolution.state === "onProgress" ?
                                                (<span className="flex gap-8 items-center justify-start">
                                                    <div className="w-8 h-8 bg-warning-600 rounded-full" />
                                                    <div className="text-m-regular">
                                                        Em desenvolvimento
                                                    </div>
                                                </span>) :
                                                (<span className="flex gap-8 items-center justify-start">
                                                    <div className="w-8 h-8 bg-neutral-600 rounded-full" />
                                                    <div className="text-m-regular">
                                                        Em breve
                                                    </div>
                                                </span>)}</Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    </div>
                    <div className='w-full flex flex-col gap-24' id={howWePrioritize.id}>
                        <Typograph tag='h2' className='text-xl-bold text-primary-900'>
                            {howWePrioritize.title}
                        </Typograph>
                        <ReactMarkdown>
                            {howWePrioritize.description}
                        </ReactMarkdown>
                    </div>
                    <div className='w-full flex flex-col gap-24' id={followAlongAndJoinIn.id}>
                        <Typograph tag='h2' className='text-xl-bold text-primary-900'>
                            {followAlongAndJoinIn.title}
                        </Typograph>
                        <ReactMarkdown>
                            {followAlongAndJoinIn.description}
                        </ReactMarkdown>
                    </div>
                    <div className='w-full flex flex-col gap-24' id={historyOfDevelopment.id}>
                        <Typograph tag='h2' className='text-xl-bold text-primary-900' >
                            {historyOfDevelopment.title}
                        </Typograph>
                        <Accordion.Root >
                            {history.map((item, index) => (
                                <Accordion.Item key={index} headingTitle={item.title} headingLevel='h2'>
                                    <div className="w-full flex flex-col px-16 border-l-2 border-primary-600 gap-16">
                                        <ReactMarkdown
                                            components={{
                                                p: ({ children }) => <p className="">{children}</p>,
                                            }}
                                        >
                                            {item.description}
                                        </ReactMarkdown>
                                    </div>
                                </Accordion.Item>
                            ))}
                        </Accordion.Root>
                    </div>
                </div >
            </div >
        </main >
    )
}
