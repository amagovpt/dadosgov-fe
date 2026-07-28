import HeroGeneral from '@/components/HeroGeneral'
import { TopicCard } from '@/components/tematic-areas/TopicCard';
import { fetchHomepageData } from '@/service/api/system';
import { getTematicAreas } from '@/service/queries/topics-areas/tematic-areas';
import { getAssets } from '@/utils/getAssets';
import { parseHtmlToParagraphs } from '@/utils/htmlToParagraphs';
import { Metadata } from 'next';
import Image from 'next/image';


export async function generateMetadata({ }: {
    params: Promise<{ locale: string; }>;
}): Promise<Metadata> {

    const { hero } = await getTematicAreas("pt");

    return {
        title: hero.title,
        description: hero.description,
    };
}

export default async function page() {

    const { site_metrics } = await fetchHomepageData();
    const { datasets, organizations } = site_metrics
    const { hero, topics } = await getTematicAreas("pt");
    const FEATURED_SLUG = "governo-administracao-publica"
    const featuredTopic = topics.find((topic) => topic.slug === FEATURED_SLUG)
    const otherTopics = topics.filter((topic) => topic.slug !== FEATURED_SLUG).toReversed()

    return (
        <div className="w-full h-full flex flex-col items-center justify-center">
            <HeroGeneral title={hero.title}>
                <div className="text-white">
                    {parseHtmlToParagraphs(hero.description)}
                </div>
            </HeroGeneral>
            <main className="w-full h-full flex flex-col items-center justify-center py-64 gap-32">
                <div className="container w-full h-full flex flex-row gap-32">
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
                <div className="container w-full h-full flex flex-row ">
                    <div className='w-1/4 [&_.card-general]:!border-0 [&_.card-general]:!border-l-4 [&_.card-general]:!border-l-primary-600 [&_.card-general]:!rounded-none [&_.icon-wrapper.trailing]:!ml-0 [&_a]:!justify-start'>
                        <TopicCard
                            topic={featuredTopic}
                            variant="primary-300"
                            iconProps={{ className: "fill-white" }}
                        />
                    </div>
                    <div className='w-3/4 relative'>
                        <Image src={getAssets(featuredTopic?.coverImage[0].id || "")} alt={featuredTopic?.title || ""} fill className='object-cover' />
                    </div>
                </div>
                <div className="container w-full h-full grid grid-cols-12 gap-32 ">
                    {otherTopics.map((topic, index) => (
                        <div className='col-span-3 [&_.card-general]:!border-l-4 [&_.card-general]:!border-l-primary-600 [&_.content]:!h-full [&_.content]:!flex [&_.content]:!flex-col [&_.content]:!justify-between [&_.icon-wrapper.trailing]:!ml-0 [&_a]:!justify-start' key={index}>
                            <TopicCard
                                topic={topic}
                                variant="primary-100"
                                iconProps={{ mode: "line", color: "#ffffff" }}
                            />
                        </div>
                    ))}
                </div>
            </main>
        </div>
    )
}
