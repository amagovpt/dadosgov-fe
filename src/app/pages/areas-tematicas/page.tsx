import HeroGeneral from '@/components/HeroGeneral'
import CardGeneral from '@/components/Primitives/Cards/CardGeneral';
import IconComponent from '@/components/Primitives/IconComponent';
import { Typograph } from '@/components/Shared/Generics/Typograph';
import { fetchHomepageData } from '@/service/api/system';
import { getTematicAreas } from '@/service/queries/topics-areas/tematic-areas';
import { getAssets } from '@/utils/getAssets';
import { parseHtmlToParagraphs } from '@/utils/htmlToParagraphs';
import Image from 'next/image';

export default async function page() {

    const { site_metrics } = await fetchHomepageData();
    const { datasets, organizations } = site_metrics
    const { hero, topics } = await getTematicAreas("pt");
    const FEATURED_SLUG = "governo-administracao-publica"
    const featuredTopic = topics.find((topic) => topic.slug === FEATURED_SLUG)
    const otherTopics = topics.filter((topic) => topic.slug !== FEATURED_SLUG).toReversed()

    return (
        <div className="w-full h-full flex flex-col items-center justify-center">
            <HeroGeneral breadcrumbItems={[{
                label: "Home",
                url: "/"
            }, {
                label: hero.title,
                url: "/pages/areas-tematicas"
            }]}
                title={hero.title}
            >
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
                        <CardGeneral {...{
                            titleText:
                                (<div className='flex flex-col gap-64'>
                                    <span className='w-56 h-56 bg-primary-600 rounded-full flex justify-center items-center'>
                                        <IconComponent name={featuredTopic?.icon || ""} className='fill-white' />
                                    </span>
                                    <Typograph tag="h3" className='text-l-bold'>
                                        {featuredTopic?.title}
                                    </Typograph>
                                </div>),
                            descriptionText: featuredTopic?.description,
                            anchor: {
                                children: "",
                                href: "areas-tematicas/" + featuredTopic?.slug,
                                hasIcon: true,
                                trailingIcon: "agora-line-arrow-right-circle",
                                trailingIconActive: "agora-line-arrow-right-circle",
                                trailingIconHover: "agora-line-arrow-right-circle",
                                appearance: "link",
                            },
                            variant: "primary-300",
                            isBlockedLink: true
                        }} />
                    </div>
                    <div className='w-3/4 relative'>
                        <Image src={getAssets(featuredTopic?.coverImage[0].id || "")} alt={featuredTopic?.title || ""} fill className='object-cover' />
                    </div>
                </div>
                <div className="container w-full h-full grid grid-cols-12 gap-32 ">
                    {otherTopics.map((topic, index) => (
                        <div className='col-span-3 [&_.card-general]:!border-l-4 [&_.card-general]:!border-l-primary-600 [&_.content]:!h-full [&_.content]:!flex [&_.content]:!flex-col [&_.content]:!justify-between [&_.icon-wrapper.trailing]:!ml-0 [&_a]:!justify-start' key={index}>
                            <CardGeneral {...{
                                titleText:
                                    (<div className='flex flex-col gap-64'>
                                        <span className='w-56 h-56 bg-primary-600 rounded-full flex justify-center items-center'>
                                            <IconComponent name={topic?.icon || ""} mode={'line'} color='#ffffff' />
                                        </span>
                                        <Typograph tag="h3" className='text-l-bold'>
                                            {topic?.title}
                                        </Typograph>
                                    </div>),
                                descriptionText: topic?.description,
                                anchor: {
                                    children: "",
                                    href: "areas-tematicas/" + topic?.slug,
                                    hasIcon: true,
                                    trailingIcon: "agora-line-arrow-right-circle",
                                    trailingIconActive: "agora-line-arrow-right-circle",
                                    trailingIconHover: "agora-line-arrow-right-circle",
                                    appearance: "link"
                                },
                                variant: "primary-100",
                                isBlockedLink: true
                            }} />
                        </div>
                    ))}
                </div>
            </main>
        </div>
    )
}
