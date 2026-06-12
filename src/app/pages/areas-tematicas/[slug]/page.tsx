import Anchor from '@/components/Shared/Anchor'
import { Typograph } from '@/components/Shared/Generics/Typograph'
import Hero from '@/components/Shared/Hero'
import SimpleSiteMap from '@/components/Shared/SiteMap/SimpleSiteMap'
import { fetchHomepageData } from '@/service/api/system'
import { getDataTopics } from '@/service/queries/topics-areas/topic'
import { parseHtmlToParagraphs } from '@/utils/htmlToParagraphs'
import { slugify } from '@/utils/slugify'

export default async function Page({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const dataTopic = await getDataTopics(slug, "pt")
    const { site_metrics } = await fetchHomepageData();
    const { datasets, organizations } = site_metrics

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


    const sitemap = sections.map((item) => ({
        children: item.heading,
        href: slugify(item.heading),
    }))


    return (
        <div className='w-full h-full flex flex-col items-center justify-center gap-32'>
            <Hero
                breadcrumbItems={[
                    {
                        label: "Home",
                        url: '/'
                    }, {
                        label: "Áreas Tématicas",
                        url: "/pages/areas-tematicas"
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
                    <span className='text-m-bold'>12</span>
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
            <div className="container grid grid-cols-12 gap-32 roadmap-page">
                <div className="md:col-span-3 hidden md:block">
                    <SimpleSiteMap
                        anchor={sitemap.map(anchor => ({
                            children: anchor.children,
                            href: anchor.href,
                        }))}
                    />
                </div>
                <div className="col-span-12 md:col-span-9 flex flex-col gap-64 pl-32  border-neutral-200 h-full">
                </div>
            </div>

        </div>
    )
}
