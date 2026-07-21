'use client';

import React from 'react';
import Breadcrumb from '@/components/Primitives/Breadcrumb/Breadcrumb';
import { twJoin } from 'tailwind-merge';
import { Typograph } from '../Generics/Typograph';

interface HeroGeneralProps {
    title: React.ReactNode;
    breadcrumbItems?: { label: string; url: string }[];
    description?: React.ReactNode;
    className?: string;
    darkMode?: boolean;
}

export default function Hero({
    title,
    breadcrumbItems,
    description,
    className = '',
    darkMode = false,
}: HeroGeneralProps) {

    return (
        <div className={twJoin("w-full bg-primary-900", className)}>
            <div className='w-full flex flex-col items-center justify-center'>
                <div className="container flex flex-col gap-64 py-64">
                    {/* Breadcrumbs Section */}
                    {breadcrumbItems && breadcrumbItems.length > 0 && (
                        <Breadcrumb
                            darkMode={!darkMode}
                            items={breadcrumbItems}
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



