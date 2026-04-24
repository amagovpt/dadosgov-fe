import React from 'react';
import MiniCourseObjectivesClient from '@/components/Courses/mini-courses/MiniCourseObjectivesClient';

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <MiniCourseObjectivesClient slug={slug} />;
}
