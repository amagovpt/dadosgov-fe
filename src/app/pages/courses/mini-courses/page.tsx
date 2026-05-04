import { Pagination } from '@/components/Pagination';
import HeroCourses from '@/components/Courses/Hero';
import CardIllustrative from '@/components/Primitives/Cards/CardIllustrative';
import Link from 'next/link';
import IconAgora from '@/components/Primitives/IconAgora';
import apolloClient from '@/services/apollo-client';
import { flattenData } from '@/utils/flattenObject';
import { getMiniCoursesPages } from '@/services/queries/courses/minicourses';
import { PageMiniCourses } from '@/services/types/courses';
import { formatHtmlParagraphs } from '@/utils/formatHtmlParagraphs';
import { getAssets } from '@/utils/getAssets';
import MiniCoursesSearchInput from '@/components/Courses/MiniCoursesSearchInput';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {

  const { page, q } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10));

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


  const searchQuery = q?.trim().toLowerCase() ?? "";
  const filteredCourses = searchQuery
    ? minicursos.filter(
      (c) =>
        c.title.toLowerCase().includes(searchQuery) ||
        c.description.toLowerCase().includes(searchQuery)
    )
    : minicursos;

  const PAGE_SIZE = 4;

  const totalItems = filteredCourses.length;
  const start = (currentPage - 1) * PAGE_SIZE;
  const paginatedCourses = filteredCourses.slice(start, start + PAGE_SIZE);

  return (
    <main className=" flex flex-col gap-32">
      <HeroCourses
        {...{
          img: {
            src: hero.image && hero.image[0] ? getAssets(hero.image[0]?.id) : "/card-full-image.png",
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
                <MiniCoursesSearchInput
                  id="courses-search"
                  label="Pesquisar minicursos"
                  hideLabel
                  placeholder="Pesquise pelo nome da formação, área técnica ou perfil"
                />
              </div>
            </div>

            {/* Results Area */}
            <div className="col-span-12 ">
              <div className="flex justify-end mb-16">
                <span className="text-[14px] text-neutral-500 font-medium tracking-tight">
                  {paginatedCourses.length} de {totalItems} resultados
                </span>
              </div>

              <div className="flex flex-col gap-24 mini-courses-cards">
                {paginatedCourses.map((course) => (
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
                  currentPage={currentPage}
                  totalItems={totalItems}
                  pageSize={PAGE_SIZE}
                  baseUrl="/pages/courses/mini-courses"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>);
}
