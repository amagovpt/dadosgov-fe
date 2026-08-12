import BreadcrumbDynamic from '@/components/Shared/BreadcrumbDynamic';
import ButtonNavigate from '@/components/Primitives/ButtonNavigate';
import { getMiniCourseIntroductionPage } from '@/service/queries/courses/minicourses';
import { formatHtmlParagraphs } from '@/utils/formatHtmlParagraphs';
import { getAssets } from '@/utils/getAssets';
import dayjs from 'dayjs';
import Image from 'next/image';
import initTranslations from '@/app/i18n';

export default async function Page({
    params,
}: {
    params: Promise<{ slug: string; locale: string }>;
}) {
    const { slug, locale } = await params;
    const { t } = await initTranslations({ locale, namespaces: ['learning'] });
    const { introduction, title, updatedAt } = await getMiniCourseIntroductionPage(slug, locale);

    if (!introduction) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg text-neutral-900">{t('miniCourseNotFound')}</p>
            </div>
        );
    }

    return (
        <main className="flex justify-center items-center w-full bg-primary-100 py-64">
            <div className="container flex flex-col gap-64">
                <BreadcrumbDynamic darkMode={false} currentLabel={title} />
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
                                {t('startCourse')}
                            </ButtonNavigate>
                        </div>
                        <div className="text-primary-900">
                            {t('updatedAt', { date: dayjs(updatedAt).format('DD.MM.YYYY') })}
                        </div>
                    </div>
                    <div className='w-full flex items-center justify-center'>
                        <Image
                            src={introduction.image && introduction.image[0] ? getAssets(introduction.image[0].id) : "/card-full-image.png"}
                            alt={t('miniCoursesImageAlt')}
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
