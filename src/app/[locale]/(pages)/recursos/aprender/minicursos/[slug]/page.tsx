import Breadcrumb from '@/components/Primitives/Breadcrumb/Breadcrumb';
import ButtonNavigate from '@/components/Primitives/ButtonNavigate';
import { getMiniCourseIntroductionPage } from '@/service/queries/courses/minicourses';
import { formatHtmlParagraphs } from '@/utils/formatHtmlParagraphs';
import { getAssets } from '@/utils/getAssets';
import dayjs from 'dayjs';
import Image from 'next/image';

export default async function Page({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const { introduction, title, updatedAt } = await getMiniCourseIntroductionPage(slug);

    if (!introduction) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg text-neutral-900">Minicurso não encontrado.</p>
            </div>
        );
    }

    return (
        <main className="flex justify-center items-center w-full bg-primary-100 py-64">
            <div className="container flex flex-col gap-64">
                <Breadcrumb
                    items={[
                        { label: 'Início', url: '/' },
                        { label: "Recursos", url: "/recursos/" },
                        { label: 'Aprender', url: '/recursos/aprender/' },
                        { label: 'Minicursos', url: '/recursos/aprender/minicursos/' },
                        { label: title, url: '#' },
                    ]}
                />
                <div className="flex">
                    <div className="w-full flex flex-col gap-64">
                        <h1 className="text-3xl-bold text-primary-600 ">
                            {introduction.title}
                        </h1>

                        <div className="text-m-regular w-full text-primary-900 whitespace-pre-wrap flex flex-col gap-16">
                            {formatHtmlParagraphs(introduction.description)}
                        </div>

                        <div className="">
                            <ButtonNavigate
                                variant="primary"
                                appearance="solid"
                                hasIcon={true}
                                trailingIcon="agora-line-arrow-right-circle"
                                trailingIconHover="agora-solid-arrow-right-circle"
                                href={`/recursos/aprender/minicursos/${slug}/1`}
                                className="px-24 h-48"
                            >
                                Iniciar Curso
                            </ButtonNavigate>
                        </div>
                        <div className="text-primary-900">
                            Atualizado em {dayjs(updatedAt).format('DD.MM.YYYY')}
                        </div>
                    </div>
                    <div className='w-full flex items-center justify-center'>
                        <Image
                            src={introduction.image && introduction.image[0] ? getAssets(introduction.image[0].id) : "/card-full-image.png"}
                            alt="Minicursos"
                            width={446}
                            height={428}
                            unoptimized
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}
