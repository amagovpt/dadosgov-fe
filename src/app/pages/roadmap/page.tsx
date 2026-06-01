import HeroGeneral from '@/components/HeroGeneral'
import SimpleSiteMap from '@/components/Shared/SiteMap/SimpleSiteMap'
import { getRoadmapPage } from '@/service/queries/roadmap';


export default async function page() {

    const {hero} = await getRoadmapPage("pt");
    


    return (
        <main className="w-full h-full flex flex-col items-center justify-center">
            <HeroGeneral
                title="Roadmap"
                backgroundImageUrl={null}
                breadcrumbItems={[
                    { label: 'Home', url: '/' },
                    { label: 'Roadmap', url: '#' },
                ]}
            >
                <div className="text-primary-900 w-full flex flex-col gap-16">

                </div>

            </HeroGeneral>
            <div className="container grid grid-cols-12 gap-32 py-64">
                <div className="col-span-3 ">
                    <SimpleSiteMap

                        title='Nesta pagina'
                        anchor={[
                            { children: 'Roadmap', href: '#roadmap' },
                            { children: 'Visão Geral', href: '#visao-geral' },
                            { children: 'Roadmap Detalhado', href: '#roadmap-detalhado' },
                        ]}
                    />
                </div>
                <div className="col-span-9 flex flex-col gap-32 px-32 border-l-2 border-neutral-200 h-full">

                </div>

            </div>
        </main>
    )
}
