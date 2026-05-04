import React from 'react';
import MiniCourseStepClient from '@/components/Courses/mini-courses/MiniCourseStepClient';
import { getMiniCourseStepsPage } from '@/services/queries/courses/minicourses';

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; step: string }>;
}) {
  const { slug, step } = await params;
  const { steps, title, conclusion } = await getMiniCourseStepsPage(slug);

  const dataSteps = [...steps, conclusion];

  if (!steps) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-neutral-600">Minicurso não encontrado.</p>
      </div>
    );
  }

  return <MiniCourseStepClient title={title} stepCourse={dataSteps} slug={slug} step={parseInt(step, 10)} />;
}
