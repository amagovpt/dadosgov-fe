"use client";
import React, { useState, useMemo } from 'react'
import { formatHtmlParagraphs } from '@/utils/formatHtmlParagraphs'
import MiniCoursesFilters from './MiniCoursesFilters';
import Link from 'next/link';
import AppIcon from '@/components/Primitives/AppIcon';
import CardIllustrative from '@/components/Primitives/Cards/CardIllustrative';
import { Pagination } from '@/components/Pagination';
import { PageMiniCourses } from '@/services/types/courses';


export interface MiniCoursesResultProps {
    filteredCourses: PageMiniCourses["minicursos"];
    currentPage: number;
    PAGE_SIZE: number;
}

export default function MiniCoursesResult({ filteredCourses, currentPage, PAGE_SIZE }: MiniCoursesResultProps) {
    const [sortKey, setSortKey] = useState('asc');

    const paginatedCourses = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return [...filteredCourses]
            .sort((a, b) => {
                if (sortKey === 'asc') return a.title.localeCompare(b.title, 'pt');
                if (sortKey === 'desc') return b.title.localeCompare(a.title, 'pt');
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
            <div className="col-span-9 ">
                <div className="flex justify-end mb-16">
                    <span className="text-s-regular text-neutral-500 font-medium tracking-tight">
                        {paginatedCourses.length} de {filteredCourses.length} resultados
                    </span>
                </div>
                {paginatedCourses.length > 0 && (
                    <div className="flex flex-col gap-24 mini-courses-cards">
                        {paginatedCourses.map((course) => (
                            <CardIllustrative
                                key={course.id}
                                variant="primary-100"
                                isCardHorizontal
                                title={course.title}
                                description={formatHtmlParagraphs(course.description)}
                                mainLink={
                                    <Link href={`/pages/learn/mini-courses/${course.id}`} className="flex items-center h-full">
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
                        baseUrl="/pages/learn/mini-courses"
                    />
                </div>
            </div>
        </>
    )
}
