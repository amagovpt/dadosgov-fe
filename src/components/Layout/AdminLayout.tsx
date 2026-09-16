"use client";

import React from 'react'
import Breadcrumb from '../Primitives/Breadcrumb/Breadcrumb'
import PublishDropdown from '../admin/PublishDropdown'

export type AdminLayoutProps = {
    title: string
    kicker?: string
    description?: string
    breadcrumbItems: {
        label: string
        url?: string
    }[],
    headerAction?: React.ReactNode
    children: React.ReactNode
}

function buildStaticAdminBreadcrumbItems(items: AdminLayoutProps["breadcrumbItems"]) {
    return items.map((item, index) => ({
        ...item,
        url: index === items.length - 1 ? "" : item.url || "#",
    }))
}

export default function AdminLayout({
    title,
    kicker,
    description,
    breadcrumbItems,
    headerAction = <PublishDropdown />,
    children,
}: AdminLayoutProps) {
    return (
        <div className="container flex flex-col gap-64 pt-64 pb-96">
            <div className="w-full flex flex-col gap-32">
                <div className="w-full">
                    <Breadcrumb
                        className="admin-breadcrumb-static"
                        items={buildStaticAdminBreadcrumbItems(breadcrumbItems)}
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
