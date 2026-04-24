'use client';

import Link from 'next/link';
import { Breadcrumb, InputSearch, CardIllustrative, Feedback, Icon } from '@ama-pt/agora-design-system';
import { MiniCoursesFilters } from './MiniCoursesFilters';
import { Pagination } from '@/components/Pagination';
import { miniCoursesData } from '@/data/miniCoursesData';
import Image from 'next/image';
import HeroCourses from '../Hero';

export default function MiniCoursesClient() {
  return (
    <div className="min-h-screen flex flex-col font-sans text-neutral-900 bg-neutral-50 ">
      <main className="flex-grow">
        <HeroCourses />
        <div className="bg-white py-64 border-t border-neutral-100">
          <div className="container mx-auto px-4 lg:px-64">
            <div className="grid md:grid-cols-3 xl:grid-cols-12 gap-[36px]">
              {/* Sidebar */}
              <div className="xl:col-span-3">
                <MiniCoursesFilters />
              </div>

              {/* Results Area */}
              <div className="xl:col-span-9">


                <div className="bg-white pt-64 pb-64">
                  <div className="container px-4 lg:px-64">
                    <div className="max-w-[700px]">
                      <h2 className="text-[18px] font-bold text-[#000066] mb-16">
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
                </div>


                <div className="flex justify-end mb-16">
                  <span className="text-[14px] text-neutral-500 font-medium tracking-tight">4 de 8 resultados</span>
                </div>

                <div className="flex flex-col gap-24 mini-courses-cards">
                  {miniCoursesData.map((course) => (
                    <CardIllustrative
                      key={course.id}
                      variant="primary-100"
                      isCardHorizontal
                      title={course.title}
                      description={course.description}
                      mainLink={
                        <Link href={`/pages/courses/mini-courses/${course.slug}`} className="flex items-center h-full">
                          <Icon name="agora-line-arrow-right-circle" className="w-[24px] h-[24px]" />
                        </Link>
                      }
                    />
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-64 flex justify-center pb-64 mini-courses-pagination">
                  <Pagination
                    currentPage={1}
                    totalItems={8}
                    pageSize={4}
                    baseUrl="/pages/courses/mini-courses"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-accent-light">
          <div className="container mx-auto">
            <div>
              <Feedback
                title="O conteúdo da página foi útil?"
                subtitle="Avalie a sua experiência nesta página e deixe-nos um comentário."
                ratingButtons={{
                  likeButton: { children: 'Sim', appearance: 'outline', variant: 'success' },
                  dislikeButton: { children: 'Não', appearance: 'outline', variant: 'danger' }
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

