'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Breadcrumb } from '@ama-pt/agora-design-system';
import { getMiniCourseBySlug } from '@/data/miniCoursesData';
import Image from 'next/image';

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
    <main className="flex justify-center items-center w-full bg-primary-100 py-64">
      <div className="container flex flex-col gap-64">
        <Breadcrumb
          items={[
            { label: 'Home', url: '/' },
            { label: 'Aprender', url: '/pages/learn/' },
            { label: 'Minicursos', url: '/pages/learn/mini-courses/' },
            { label: course.title, url: '#' },
          ]}
        />
        <div className="flex">
          <div className="w-full flex flex-col gap-64">
            <h1 className="text-3xl-bold text-primary-600 ">
              {course.title}
            </h1>

            <div className="text-m-regular w-full">
              <p className="text-primary-900">{course.description}</p>
            </div>

            <div className="">
              <Button
                variant="primary"
                appearance="solid"
                hasIcon={true}
                trailingIcon="agora-line-arrow-right-circle"
                trailingIconHover="agora-solid-arrow-right-circle"
                onClick={() =>
                  router.push(`/pages/learn/mini-courses/${slug}/objectives`)
                }
                className="px-24 h-48"
              >
                Ver objetivos
              </Button>
            </div>
            <div className="text-primary-900">
              Atualizado em {course.updatedAt}
            </div>
          </div>
          <div className='w-full flex items-center justify-center'>
            <Image
              src="/card-full-image.png"
              alt="Minicursos"
              width={446}
              height={428}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
