export const dynamic = "force-dynamic";
import HeroCourses from '@/components/Learn/Hero';
import apolloClient from '@/service/utils/apollo-client';
import { flattenData } from '@/utils/flattenObject';
import { getMiniCoursesPages } from '@/service/queries/courses/minicourses';
import { PageMiniCourses } from '@/service/types/courses';
import { getAssets } from '@/utils/getAssets';
import MiniCoursesSearchInput from '@/components/Learn/MiniCoursesSearchInput';
import MiniCoursesResult from '@/components/Learn/mini-courses/MiniCoursesResult';

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


  const PAGE_SIZE = 4;
  const searchQuery = q?.trim().toLowerCase() ?? "";
  const filteredCourses = searchQuery
    ? minicursos.filter(
      (c) =>
        c.title.toLowerCase().includes(searchQuery) ||
        c.description.toLowerCase().includes(searchQuery)
    )
    : minicursos;


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
            <MiniCoursesResult filteredCourses={filteredCourses} currentPage={currentPage} PAGE_SIZE={PAGE_SIZE} />

          </div>
        </div>
      </div>
    </main>);
}
