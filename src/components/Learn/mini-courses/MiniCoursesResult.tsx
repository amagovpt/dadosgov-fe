"use client";
import React, { useState, useMemo, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation';
import { formatHtmlParagraphs } from '@/utils/formatHtmlParagraphs'
import MiniCoursesFilters from './MiniCoursesFilters';
import Link from 'next/link';
import AppIcon from '@/components/Primitives/AppIcon';
import CardIllustrative from '@/components/Primitives/Cards/CardIllustrative';
import { Pagination, buildPageUrl } from '@/components/Pagination';
import { PageMiniCourses } from '@/service/types/courses';
import { useTranslation } from 'react-i18next';


export interface MiniCoursesResultProps {
    filteredCourses: PageMiniCourses["minicursos"];
    currentPage: number;
    PAGE_SIZE: number;
}

export default function MiniCoursesResult({ filteredCourses, currentPage: initialPage, PAGE_SIZE }: MiniCoursesResultProps) {
    const [sortKey, setSortKey] = useState('asc');
    const { t, i18n } = useTranslation('learning');
    const searchParams = useSearchParams();
    const resultsRef = useRef<HTMLDivElement>(null);

    // Every filtered course is already here, so paging is client-only: `goToPage` pushes the
    // URL and Next syncs it into `useSearchParams`, which also keeps back/forward working.
    const urlPage = parseInt(searchParams.get('page') ?? '', 10);
    const currentPage = Number.isNaN(urlPage) ? initialPage : Math.max(1, urlPage);

    // The DS `SearchPagination` calls `onChange` with the active page on mount and whenever the
    // callback identity changes, so the callback is stable and ignores the page already shown;
    // otherwise every render pushed the URL again and scrolled back up to the results.
    const goToPage = useCallback((page: number) => {
        if (page === currentPage) return;

        window.history.pushState(null, '', buildPageUrl(page));

        const results = resultsRef.current;
        if (results && results.getBoundingClientRect().top < 0) {
            const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            results.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
        }
    }, [currentPage]);

    const paginatedCourses = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return [...filteredCourses]
            .sort((a, b) => {
                if (sortKey === 'asc') return a.title.localeCompare(b.title, i18n.language);
                if (sortKey === 'desc') return b.title.localeCompare(a.title, i18n.language);
                if (sortKey === 'newest') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                return 0;
            })
            .slice(start, start + PAGE_SIZE);
    }, [filteredCourses, sortKey, currentPage, PAGE_SIZE]);

    return (
        <>
            <div className="col-span-3">
                <MiniCoursesFilters onSortChange={setSortKey} />
            </div>
            <div className="col-span-9 scroll-mt-32" ref={resultsRef}>
                <div className="flex justify-end mb-16">
                    <span className="text-s-regular text-neutral-500 font-medium tracking-tight">
                        {t('results', { shown: paginatedCourses.length, total: filteredCourses.length })}
                    </span>
                </div>
                {paginatedCourses.length > 0 && (
                    <div
                        key={currentPage}
                        className="flex flex-col gap-24 mini-courses-cards animate-fade-in motion-reduce:animate-none"
                    >
                        {paginatedCourses.map((course) => (
                            <CardIllustrative
                                key={course.id}
                                variant="primary-100"
                                isCardHorizontal
                                title={course.title}
                                description={formatHtmlParagraphs(course.description)}
                                mainLink={
                                    <Link href={`/recursos/aprender/minicursos/${course.id}`} className="flex items-center h-full">
                                        <AppIcon name="agora-line-arrow-right-circle" className="w-24 h-24" />
                                    </Link>
                                }
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                <div className="mt-64 flex justify-center pb-64 mini-courses-pagination">
                    <Pagination
                        currentPage={currentPage}
                        totalItems={filteredCourses.length}
                        pageSize={PAGE_SIZE}
                        onPageChange={goToPage}
                    />
                </div>
            </div>
        </>
    )
}
