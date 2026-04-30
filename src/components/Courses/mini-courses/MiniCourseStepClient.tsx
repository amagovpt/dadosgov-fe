'use client';
import { useRouter } from 'next/navigation';
import { Breadcrumb, Button } from '@ama-pt/agora-design-system';
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { twJoin } from 'tailwind-merge';
import { BodyCourse } from '@/services/types/courses';
import { formatHtmlParagraphs } from '@/utils/formatHtmlParagraphs';

interface Props {
  slug: string;
  stepCourse: BodyCourse[];
  step: number;
}

export default function CourseStepClient({ slug, stepCourse, step }: Props) {
  const router = useRouter();
  const course = stepCourse;
  const parentRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const positionImg = "right"

  function getImagePositionClass(position: string) {
    switch (position) {
      case "left":
        return "flex-row-reverse";
      case "top":
        return "flex-col-reverse";
      case "bottom":
        return "flex-col";
      case "right":
      default:
        return "";
    }
  }


  useEffect(() => {
    if (parentRef.current && cardRef.current) {
      const cardHeight = cardRef.current.offsetHeight;
      parentRef.current.style.minHeight = `${cardHeight + 96}px`;
    }
  }, []);

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-neutral-600">Minicurso não encontrado.</p>
      </div>
    );
  }

  const currentStep = course.length >= step ? course[step - 1] : null;
  if (!currentStep) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-neutral-600">Passo não encontrado.</p>
      </div>
    );
  }

  const isFirstStep = step === 1;
  const isLastStep = step === course.length;
  const progressPercent = (step / course.length) * 100;
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
    <main className="w-full flex flex-col justify-center items-center bg-primary-100">
      <div className='container py-64'>
        <Breadcrumb
          items={[
            { label: 'Início', url: '/' },
            { label: 'Mini Cursos', url: '/pages/courses/mini-courses/' },
            { label: course[step].title, url: '#' },
          ]}
        />
      </div>
      {/* Dark blue background area */}
      <div className='w-full h-full' ref={parentRef}>
        <div className='w-full bg-primary-900 flex items-center justify-center'>
          <div className="container h-96 flex flex-col xl:flex-row items-center justify-between relative">
            <div className="flex items-baseline gap-4 flex-1 w-[15%]">
              <span className="text-[64px] leading-[64px] font-extrabold text-white">
                {stepLabel}
              </span>
              <span className="text-[36px] leading-[64px] text-white font-normal">
                / {course.length}
              </span>
            </div>
            <div className='w-[85%] absolute right-0 top-0' ref={cardRef}>
              <div className="container">
                <div className="">
                  {/* Progress bar */}
                  <div className="w-full h-[13px] bg-neutral-200">
                    <div
                      className="h-full bg-success-500 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className='flex flex-col gap-32'>

                    <div className="bg-white rounded-b-8 shadow-[0_20px_20px_rgba(0,0,0,0.05)]  p-48">
                      <div className={twJoin("flex gap-16", getImagePositionClass(positionImg))}>
                        <div className="flex-1 flex flex-col gap-8">
                          {currentStep.title && (
                            <h2 className="text-l-bold text-neutral-900">
                              {currentStep.title}
                            </h2>
                          )}
                          {currentStep.description && (
                            <span className="text-m-regular text-neutral-900">
                              {formatHtmlParagraphs(currentStep.description)}
                            </span>
                          )}
                        </div>

                        <div className="bg-primary-100 rounded-8 flex items-center justify-center">
                          {currentStep.image && (
                            <Image
                              src={currentStep.image[0]?.url ?? "/card-full-image.png"}
                              alt={currentStep.title ?? "Imagem do passo"}
                              width={280}
                              height={281}
                              className="max-w-full max-h-full object-contain"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end items-center gap-32 w-full">
                      <div className={twJoin("flex gap-16", !isFirstStep ? "w-full justify-between" : "")}>
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

                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </main >
  );
}
