import { Pagination } from '@/components/Pagination';
import { miniCoursesData } from '@/data/miniCoursesData';
import HeroCourses from '@/components/Courses/Hero';
import { MiniCoursesFilters } from '@/components/Courses/mini-courses/MiniCoursesFilters';
import InputSearch from '@/components/Primitives/InputSearch';
import CardIllustrative from '@/components/Primitives/Cards/CardIllustrative';
import Link from 'next/link';
import IconAgora from '@/components/Primitives/IconAgora';
import apolloClient from '@/services/apollo-client';
import { flattenData } from '@/utils/flattenObject';
import { getMiniCoursesPages } from '@/services/queries/courses/minicourses';
import { PageMiniCourses } from '@/services/types/courses';
import { formatHtmlParagraphs } from '@/utils/formatHtmlParagraphs';

export default async function Page() {



  const { data, error } = await apolloClient.query<{
    findPageMinicursosSingleton: {
      data: Record<string, unknown>
    }
  }>({
    query: getMiniCoursesPages("pt")
  })

  if (!data && error) {
    console.error("Error fetching courses page data:", error);
    return <div>Error loading page data</div>;
  }

  const { hero, minicursos } = flattenData(data?.findPageMinicursosSingleton?.data || {}) as unknown as PageMiniCourses;


  return (
    <main className=" flex flex-col gap-32">
      <HeroCourses
        {...{
          img: {
            src: hero.image[0]?.url ?? "/card-full-image.png",
            alt: hero.title ?? "Minicursos"
          },
          updatedAt: hero.updatedAt ?? "2025-09-30T12:00",
          title: hero.title,
          description: hero.description,
          breadcrumbItems: [
            { label: 'Início', url: '/' },
            { label: 'Cursos', url: '/pages/courses/' },
            { label: 'Minicursos', url: '/pages/courses/mini-courses/' }
          ]
        }}
      />

      <div className="flex justify-center items-center">
        <div className="container">
          <div className="grid md:grid-cols-3 xl:grid-cols-12 gap-32">
            <div className="col-span-9 col-start-4">
              <div className="max-w-[591px] flex flex-col gap-16">
                <h2 className="text-l-semibold ">
                  Que minicurso procura?
                </h2>
                <InputSearch
                  id="courses-search"
                  label="Pesquisar minicursos"
                  hideLabel
                  placeholder="Pesquise pelo nome da formação, área técnica ou perfil"
                />
              </div>
            </div>
            {/* Sidebar */}
            <div className="xl:col-span-3">
              <MiniCoursesFilters />
            </div>

            {/* Results Area */}
            <div className="xl:col-span-9 ">
              <div className="flex justify-end mb-16">
                <span className="text-[14px] text-neutral-500 font-medium tracking-tight">{minicursos.length} resultados</span>
              </div>

              <div className="flex flex-col gap-24 mini-courses-cards">
                {minicursos.map((course) => (
                  <CardIllustrative
                    key={course.id}
                    variant="primary-100"
                    isCardHorizontal
                    title={course.title}
                    description={formatHtmlParagraphs(course.description)}
                    mainLink={
                      <Link href={`/pages/courses/mini-courses/${course.id}`} className="flex items-center h-full">
                        <IconAgora name="agora-line-arrow-right-circle" className="w-24 h-24" />
                      </Link>
                    }
                  />
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-64 flex justify-center pb-64 mini-courses-pagination">
                <Pagination
                  currentPage={1}
                  totalItems={minicursos.length}
                  pageSize={4}
                  baseUrl="/pages/courses/mini-courses"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>);
}
