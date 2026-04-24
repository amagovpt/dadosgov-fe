'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Breadcrumb } from '@ama-pt/agora-design-system';
import { getMiniCourseBySlug } from '@/data/miniCoursesData';

interface Props {
  slug: string;
}

export default function MiniCourseDetailClient({ slug }: Props) {
  const router = useRouter();
  const course = getMiniCourseBySlug(slug);

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-neutral-600">Minicurso não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col font-sans text-neutral-900 bg-white min-h-screen">
      <main className="flex-grow bg-white">
        <div className="bg-primary-100 py-64">
          <div className="container mx-auto px-4 lg:px-64">
            <Breadcrumb
              items={[
                { label: 'Início', url: '/' },
                { label: 'Mini Cursos', url: '/pages/courses/mini-courses/' },
                { label: course.title, url: '#' },
              ]}
              className="mb-64"
            />
            <div className="flex gap-[84px]">
              <div className="w-1/2 pr-32">
                <h1 className="text-[32px] leading-[40px] font-bold text-primary-600 mb-16">
                  {course.title}
                </h1>

                <div className="text-[18px] leading-[28px] space-y-16 w-[94%]">
                  <p className="text-primary-900">{course.description}</p>
                </div>

                <div className="mt-32">
                  <Button
                    variant="primary"
                    appearance="solid"
                    hasIcon={true}
                    trailingIcon="agora-line-arrow-right-circle"
                    trailingIconHover="agora-solid-arrow-right-circle"
                    onClick={() =>
                      router.push(`/pages/courses/mini-courses/${slug}/objectives`)
                    }
                    className="px-24 h-48"
                  >
                    Ver objetivos
                  </Button>
                </div>

                <div className="mt-64 text-primary-900">
                  Atualizado em {course.updatedAt}
                </div>
              </div>
              <div className="img-container">
                <img
                  src="/minicourses/medal.png"
                  alt="Minicursos"
                  className="w-[446px] h-[428px] mt-[-85px]"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
