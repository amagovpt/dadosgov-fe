import React from 'react';
import MiniCourseStepClient from '@/components/Learn/mini-courses/MiniCourseStepClient';
import initTranslations from '@/app/i18n';
import { getMiniCourseStepsPage } from '@/service/queries/courses/minicourses';

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; step: string; locale: string }>;
}) {
  const { slug, step, locale } = await params;
  const { t } = await initTranslations({ locale, namespaces: ['learning'] });
  const { steps, title, conclusion } = await getMiniCourseStepsPage(slug);

  const dataSteps = [...steps, conclusion];

  if (!steps) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-neutral-600">{t('miniCourseNotFound')}</p>
      </div>
    );
  }

  return <MiniCourseStepClient title={title} stepCourse={dataSteps} slug={slug} step={parseInt(step, 10)} />;
}
