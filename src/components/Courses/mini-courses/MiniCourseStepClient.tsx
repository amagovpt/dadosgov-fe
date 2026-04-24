'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@ama-pt/agora-design-system';
import { getMiniCourseBySlug } from '@/data/miniCoursesData';

interface Props {
  slug: string;
  step: number;
}

export default function MiniCourseStepClient({ slug, step }: Props) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const course = getMiniCourseBySlug(slug);

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-neutral-600">Minicurso não encontrado.</p>
      </div>
    );
  }

  const currentStep = course.steps.find((s) => s.id === step);
  if (!currentStep) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-neutral-600">Passo não encontrado.</p>
      </div>
    );
  }

  const isFirstStep = step === 1;
  const isLastStep = step === course.totalSteps;
  const progressPercent = (step / course.totalSteps) * 100;
  const stepLabel = step.toString().padStart(2, "0");

  const handleNext = () => {
    if (isLastStep) {
      router.push(`/pages/courses/mini-courses/${slug}/conclusion`);
    } else {
      router.push(`/pages/courses/mini-courses/${slug}/steps/${step + 1}`);
    }
  };

  const handlePrevious = () => {
    router.push(`/pages/courses/mini-courses/${slug}/steps/${step - 1}`);
  };

  return (
    <div className="flex flex-col font-sans text-neutral-900 min-h-screen">
      <main className="flex-grow">
        {/* Dark blue background area */}
        <div className="bg-primary-900 pt-[32px] pb-[200px]">
          <div className="container mx-auto px-4 lg:px-64">
            <div className="flex items-baseline gap-[4px]">
              <span className="text-[64px] leading-[64px] font-extrabold text-white">
                {stepLabel}
              </span>
              <span className="text-[36px] leading-[64px] text-white font-normal">
                / {course.totalSteps}
              </span>
            </div>
          </div>
        </div>

        {/* Card overlapping the dark area */}
        <div className="container mx-auto px-4 lg:px-64 -mt-[160px]">
          <div className="mini-course-step-card">
            {/* Progress bar */}
            <div className="w-full h-[13px] bg-neutral-200">
              <div
                className="h-full bg-success-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Card content */}
            <div className="bg-white rounded-b-8 shadow-[0_20px_20px_rgba(0,0,0,0.05)] border border-t-0 border-neutral-100 p-[48px]">
              <div className="flex gap-[16px]">
                {/* Left: text */}
                <div className="flex-1 flex flex-col gap-[8px]">
                  <h2 className="text-[20px] leading-[32px] font-bold text-[#0C1932]">
                    {currentStep.title}
                  </h2>
                  <p className="text-[16px] leading-[28px] text-neutral-700">
                    {currentStep.content}
                  </p>
                </div>

                {/* Right: image placeholder */}
                <div className="shrink-0 w-[280px] h-[281px] bg-primary-100 rounded-8 flex items-center justify-center">
                  {currentStep.image ? (
                    <img
                      src={currentStep.image}
                      alt={currentStep.title}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <span className="text-primary-300 text-[48px] font-bold">
                      A
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="container mx-auto px-4 lg:px-64 mt-[32px] pb-[64px]">
          <div className="flex justify-end items-center gap-[32px]">
            {/* <Button
              variant="primary"
              appearance="outline"
              hasIcon={true}
              leadingIcon={isFavorite ? "agora-solid-star" : "agora-line-star"}
              leadingIconHover="agora-solid-star"
              onClick={() => setIsFavorite(!isFavorite)}
            >
              Adicionar aos favoritos
            </Button> */}

            <div className="flex gap-[16px]">
              {!isFirstStep && (
                <Button
                  variant="primary"
                  appearance="outline"
                  hasIcon={true}
                  leadingIcon="agora-line-arrow-left-circle"
                  leadingIconHover="agora-solid-arrow-left-circle"
                  onClick={handlePrevious}
                >
                  Anterior
                </Button>
              )}
              <Button
                variant="primary"
                appearance="solid"
                hasIcon={true}
                trailingIcon="agora-line-arrow-right-circle"
                trailingIconHover="agora-solid-arrow-right-circle"
                onClick={handleNext}
              >
                {isLastStep ? "Concluir curso" : "Seguinte"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
