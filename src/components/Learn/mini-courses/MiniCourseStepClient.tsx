'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@ama-pt/agora-design-system';
import BreadcrumbDynamic from '@/components/Shared/BreadcrumbDynamic';
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { twJoin, twMerge } from 'tailwind-merge';
import { BodyCourse } from '@/service/types/courses';
import { formatHtmlParagraphs } from '@/utils/formatHtmlParagraphs';
import Link from 'next/link';
import { getAssets } from '@/utils/getAssets';

interface Props {
  title: string;
  slug: string;
  stepCourse: BodyCourse[];
  step: number;
}

const socialLinks = [
  { name: 'Facebook', icon: 'agora-line-facebook' },
  { name: 'Twitter', icon: 'agora-line-twitter' },
  { name: 'LinkedIn', icon: 'agora-line-linkedin' },
  { name: 'WhatsApp', customIcon: '/Icons/whatsapp.svg' },
  { name: 'e-mail', icon: 'agora-line-mail' },
];

export default function CourseStepClient({ title, slug, stepCourse, step }: Props) {


  const router = useRouter();
  const course = stepCourse;
  const parentRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

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
      router.push(`/recursos/aprender/minicursos`);
    } else {
      router.push(`/recursos/aprender/minicursos/${slug}/${step + 1}`);
    }
  };

  const handlePrevious = () => {
    router.push(`/recursos/aprender/minicursos/${slug}/${step - 1}`);
  };



  return (
    <main className="w-full flex flex-col justify-center items-center bg-primary-100 gap-64 py-64">
      <div className='container '>
        {/* The step number is not part of the trail: the course is the deepest crumb. */}
        <BreadcrumbDynamic
          darkMode={false}
          path={`/recursos/aprender/minicursos/${slug}`}
          currentLabel={title}
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
                      <div className={twJoin("flex gap-16", getImagePositionClass(currentStep.imagePosition ?? "left"))}>
                        <div className="flex-1 flex flex-col gap-8">
                          {currentStep.title && (
                            <h2 className={twMerge("text-neutral-900", isLastStep ? "!text-xl-bold text-brand-blue-secondary whitespace-break-spaces" : "text-l-bold")}>
                              {currentStep.title.replace('! ', `! \n`)}
                            </h2>
                          )}
                          {currentStep.description && (
                            <span className="text-m-regular text-neutral-900">
                              {formatHtmlParagraphs(currentStep.description)}
                            </span>
                          )}
                        </div>

                        <div className="rounded-8">
                          {currentStep.image && (
                            <Image
                              src={getAssets(currentStep.image[0]?.id) ?? "/card-full-image.png"}
                              alt={currentStep.title ?? "Imagem do passo"}
                              width={["top", "bottom"].includes(currentStep.imagePosition ?? "") ? 796 : 350}
                              height={281}
                              className="max-w-full max-h-full object-contain bg-primary-100"
                              unoptimized
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
                          {isLastStep ? "Ver mais cursos" : "Seguinte"}
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
      {/* Share section */}
      <div className={twMerge("container flex flex-col gap-16", isLastStep ? "block" : "hidden")}>
        <p className="text-m-regular text-primary-800 ">
          Partilhar este minicurso
        </p>
        <div className="flex flex-row gap-16">
          {socialLinks.map((link) => (
            <Link key={link.name} href="#" className="no-underline">
              <Button
                appearance="link"
                variant="primary"
                hasIcon={!!link.icon}
                leadingIcon={link.icon}
                leadingIconHover={link.icon?.replace(
                  'agora-line-',
                  'agora-solid-'
                )}
                className="!flex !items-center !text-neutral-700 hover:!text-primary-700 font-medium !gap-8"
              >
                <div className="flex items-center gap-8">
                  {!link.icon && link.customIcon && (
                    <img
                      src={link.customIcon}
                      alt=""
                      className="w-20 h-20 flex-shrink-0"
                    />
                  )}
                  <span>{link.name}</span>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </main >
  );
}
