import Anchor from '@/components/Shared/Anchor'
import { Typograph } from '@/components/Shared/Generics/Typograph'
import Hero from '@/components/Shared/Hero'
import SimpleSiteMap from '@/components/Shared/SiteMap/SimpleSiteMap'
import { fetchHomepageData } from '@/service/api/system'
import { getDataTopics } from '@/service/queries/topics-areas/topic'
import { parseHtmlToParagraphs } from '@/utils/htmlToParagraphs'
import { slugify } from '@/utils/slugify'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { TopicCard } from '@/components/tematic-areas/TopicCard'
import { getTematicAreas } from '@/service/queries/topics-areas/tematic-areas'


export default async function Page({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const remarkPlugins = [remarkGfm]
    const rehypePlugins = [rehypeRaw, rehypeSanitize]
    const { slug } = await params
    const dataTopic = await getDataTopics(slug, "pt")
    const { site_metrics } = await fetchHomepageData();
    const { topics } = await getTematicAreas("pt");
    const { datasets, organizations } = site_metrics

    const hashString = (value: string) =>
        value.split("").reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0)

    const randomTopics = topics
        .filter((topic) => topic.slug !== slug)
        .map((topic) => ({ topic, order: hashString(topic.slug) }))
        .sort((a, b) => a.order - b.order)
        .slice(0, 3)
        .map(({ topic }) => topic)

    if (!dataTopic) {
        return (
            <div className='w-full h-full py-64 flex justify-center items-center'>
                <Typograph tag="h2" className="text-2xl-bold text-neutral-700 text-center">
                    Não foi possivel encontrar este tema
                </Typograph>
            </div>
        )
    }

    const { title, sections, description, intro } = dataTopic


    const sitemap = [{
        children: title,
        href: "#" + slugify(title),
    },
    ...sections.map((item) => ({
        children: item.heading,
        href: "#" + slugify(item.heading),
    }))]


    return (
        <div className='w-full h-full flex flex-col items-center justify-center gap-32'>
            <Hero
                breadcrumbItems={[
                    {
                        label: "Home",
                        url: '/'
                    }, {
                        label: "Áreas Tématicas",
                        url: "/areas-tematicas"
                    },
                    {
                        label: title,
                        url: "#"
                    }
                ]}
                title={title}
                description={parseHtmlToParagraphs(description)}
            />
            <div className="container w-full h-full flex flex-row gap-32 py-32">
                <div className="flex flex-row gap-8">
                    <span className='text-m-bold'>{topics.length}</span>
                    <span className='text-m-regular'>Áreas Temáticas</span>
                </div>
                <div className="flex flex-row gap-8">
                    <span className='text-m-bold'>{datasets.toLocaleString("pt-PT")}</span>
                    <span className='text-m-regular'>Conjunto de Dados</span>
                </div>
                <div className="flex flex-row gap-8">
                    <span className='text-m-bold'>{organizations.toLocaleString("pt-PT")}</span>
                    <span className='text-m-regular'>Organizações</span>
                </div>
            </div>
            <div className="container grid grid-cols-12 gap-32 roadmap-page pb-32">
                <div className="md:col-span-4 hidden md:block">
                    <SimpleSiteMap
                        anchor={sitemap.map(anchor => ({
                            children: anchor.children,
                            href: anchor.href,
                        }))}
                    />
                </div>
                <div className="col-span-12 md:col-span-8 flex flex-col gap-64 pl-32  border-neutral-200 h-full">
                    <div className='flex flex-col gap-16 max-w-[592px] px-32' id={slugify(title)}>
                        <ReactMarkdown
                            remarkPlugins={remarkPlugins}
                            rehypePlugins={rehypePlugins}
                            components={{
                                h2: ({ children }) => <h2 className="text-xl-bold text-primary-900">{children}</h2>,
                                a: ({ href, children }) => (
                                    <Anchor href={href} appearance='link' className="!py-0 !min-h-[12px] !min-w-[12px]" >
                                        {children}
                                    </Anchor>
                                ),
                                strong: ({ children }) => <strong className='text-m-semibold'>{children}</strong>,
                                ol: ({ children }) => <ol className="list-decimal pl-6 [&_li::marker]:font-bold">{children}</ol>,
                                ul: ({ children }) => <ul className="list-disc pl-6">{children}</ul>,
                                li: ({ children }) => <li className="ml-32">{children}</li>,
                            }}
                        >
                            {intro}
                        </ReactMarkdown>
                    </div>
                    {sections.map((section, index) =>
                    (<div className='flex flex-col gap-16 max-w-[650px] px-32' key={index} id={slugify(section.heading)}>
                        <Typograph tag="h2" className="text-xl-bold text-primary-900">
                            {section.heading}
                        </Typograph>
                        <div className='flex flex-col gap-32'>
                            <div className='w-full h-full flex flex-col'>
                                <ReactMarkdown
                                    remarkPlugins={remarkPlugins}
                                    rehypePlugins={rehypePlugins}
                                    components={{
                                        a: ({ href, children }) => (
                                            <Anchor href={href} appearance='link' className="!py-0 !min-h-[12px] !min-w-[12px]" >
                                                {children}
                                            </Anchor>
                                        ),
                                        ol: ({ children }) => <ol className="list-decimal pl-6 [&_li::marker]:font-bold">{children}</ol>,
                                        ul: ({ children }) => <ul className="list-disc pl-6">{children}</ul>,
                                        li: ({ children }) => <li className="ml-32">{children}</li>,
                                    }}
                                >
                                    {section.body}
                                </ReactMarkdown>
                            </div>
                            <div className='flex flex-col ml-32 border-l-2 border-primary-600 pl-16'>
                                {section.datasets.map((dataset, index) => (
                                    <Anchor className='!justify-start' href={"pages/" + dataset.href} key={index}>
                                        {dataset.children}
                                    </Anchor>
                                ))}
                            </div>
                        </div>
                    </div>))}
                </div>
            </div>

            <div className='w-full flex justify-center items-center bg-neutral-100 py-64'>
                <div className='container w-full h-full flex flex-col gap-32'>
                    <div className='w-full flex justify-between items-center'>
                        <Typograph tag="h2" className='text-xl-bold'>
                            Outras Áreas Temáticas
                        </Typograph>
                        <Anchor
                            href='/areas-tematicas'
                            hasIcon trailingIcon='agora-line-arrow-right-circle'
                            trailingIconActive='agora-line-arrow-right-circle'
                            trailingIconHover='agora-solid-arrow-right-circle'
                        >
                            Ver todas as áreas temáticas
                        </Anchor>
                    </div>
                    <div className='w-full h-full grid grid-cols-12 gap-32'>
                        {randomTopics.map((topic, index) => (
                            <div className='col-span-4 [&_.card-general]:!border-l-4 [&_.card-general]:!border-l-primary-600 [&_.content]:!h-full [&_.content]:!flex [&_.content]:!flex-col [&_.content]:!justify-between [&_.icon-wrapper.trailing]:!ml-0 [&_a]:!justify-start' key={index}>
                                <TopicCard
                                    topic={topic}
                                    iconProps={{ mode: "line", color: "#ffffff" }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

            </div>

        </div >
    )
}
