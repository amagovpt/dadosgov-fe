"use client";

import React from 'react'
import { useTranslation } from 'react-i18next'
import Breadcrumb from '../Primitives/Breadcrumb/Breadcrumb'
import PublishDropdown from '../admin/PublishDropdown'
import { buildAdminBreadcrumbItems, type AdminBreadcrumbItem } from '@/utils/adminBreadcrumbs'

export type AdminLayoutProps = {
    title: string
    kicker?: string
    description?: string
    /** Section and detail items; the layout adds the administration root. */
    breadcrumbItems: AdminBreadcrumbItem[],
    headerAction?: React.ReactNode
    children: React.ReactNode
}

export default function AdminLayout({
    title,
    kicker,
    description,
    breadcrumbItems,
    headerAction = <PublishDropdown />,
    children,
}: AdminLayoutProps) {
    const { t } = useTranslation('admin-common')
    return (
        <div className="container flex flex-col gap-32 pt-64 pb-96">
            <div className="w-full flex flex-col gap-32">
                <div className="w-full">
                    <Breadcrumb
                        className="admin-breadcrumb-static"
                        items={buildAdminBreadcrumbItems({ t, items: breadcrumbItems })}
                        validateUrls={false}
                        onClickCapture={(event) => event.preventDefault()}
                    />
                </div>

                <div className="w-full flex flex-col items-start gap-24 xl:flex-row xl:items-end xl:justify-between">
                    <div className="flex flex-col gap-8 max-w-[696px]">
                        {kicker && <span className="text-sm text-neutral-700">{kicker}</span>}
                        <h1 className="text-2xl-bold text-brand-blue-secondary">
                            {title}
                        </h1>
                        {description && <p className="text-base text-neutral-700">{description}</p>}
                    </div>
                    {headerAction}
                </div>
            </div>
            <>
                {children}
            </>
        </div>
    )
}
