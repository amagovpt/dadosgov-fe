'use client';

import React from 'react';
import BreadcrumbDynamic from '@/components/Shared/BreadcrumbDynamic';
import { twJoin } from 'tailwind-merge';
import { Typograph } from '../Generics/Typograph';

interface HeroGeneralProps {
    title: React.ReactNode;
    /** Render the route-derived breadcrumb. Default `true`. */
    hasBreadcrumb?: boolean;
    /** Label overrides for intermediate dynamic segments, keyed by raw segment. */
    breadcrumbOverrides?: Record<string, React.ReactNode>;
    /** Label for the last crumb (a CMS/API title). */
    breadcrumbCurrentLabel?: React.ReactNode;
    description?: React.ReactNode;
    className?: string;
    darkMode?: boolean;
}

export default function Hero({
    title,
    hasBreadcrumb = true,
    breadcrumbOverrides,
    breadcrumbCurrentLabel,
    description,
    className = '',
    darkMode = false,
}: HeroGeneralProps) {

    return (
        <div className={twJoin("w-full bg-primary-900", className)}>
            <div className='w-full flex flex-col items-center justify-center'>
                <div className="container flex flex-col gap-64 py-64">
                    {/* Breadcrumbs Section */}
                    {hasBreadcrumb && (
                        <BreadcrumbDynamic
                            darkMode={!darkMode}
                            overrides={breadcrumbOverrides}
                            currentLabel={breadcrumbCurrentLabel}
                        />
                    )}
                    {/* Content Section (Title & description) */}
                    <div className="max-w-2xl flex flex-col gap-16">
                        {title && (
                            <Typograph tag="h1" className="text-white flex flex-col ">
                                <span className="text-2xl-bold">
                                    {title}
                                </span>
                            </Typograph>
                        )}
                        {description && (
                            <Typograph tag='p' className="text-white text-m-regular">
                                {description}
                            </Typograph>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};



