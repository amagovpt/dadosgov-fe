import React from 'react';
import MiniCourseStepClient from '@/components/Courses/mini-courses/MiniCourseStepClient';

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; step: string }>;
}) {
  const { slug, step } = await params;

  return <MiniCourseStepClient slug={slug} step={parseInt(step, 10)} />;
}
