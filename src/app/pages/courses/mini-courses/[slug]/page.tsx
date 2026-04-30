import ButtonNavigate from '@/components/Primitives/ButtonNavigate';
import { getMiniCourseIntroductionPage } from '@/services/queries/courses/minicourses';
import { formatHtmlParagraphs } from '@/utils/formatHtmlParagraphs';
import dayjs from 'dayjs';
import Image from 'next/image';

export default async function Page({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const course = await getMiniCourseIntroductionPage(slug);

    if (!course) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg text-neutral-900">Minicurso não encontrado.</p>
            </div>
        );
    }

    return (
        <main className="flex justify-center items-center w-full bg-primary-100 py-64">
            <div className="container flex flex-col gap-64">
                {/* <Breadcrumb
                    items={[
                        { label: 'Início', url: '/' },
                        { label: 'Mini Cursos', url: '/pages/courses/mini-courses/' },
                        { label: course.title, url: '#' },
                    ]}
                /> */}
                <div className="flex">
                    <div className="w-full flex flex-col gap-64">
                        <h1 className="text-3xl-bold text-primary-600 ">
                            {course.introduction.title}
                        </h1>

                        <div className="text-m-regular w-full text-primary-900 whitespace-pre-wrap flex flex-col gap-16">
                            {formatHtmlParagraphs(course.introduction.description)}
                        </div>

                        <div className="">
                            <ButtonNavigate
                                variant="primary"
                                appearance="solid"
                                hasIcon={true}
                                trailingIcon="agora-line-arrow-right-circle"
                                trailingIconHover="agora-solid-arrow-right-circle"
                                href={`/pages/courses/mini-courses/${slug}/steps/1`}
                                className="px-24 h-48"
                            >
                                Iniciar Curso
                            </ButtonNavigate>
                        </div>
                        <div className="text-primary-900">
                            Atualizado em {dayjs(course.updatedAt).format('DD.MM.YYYY')}
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
