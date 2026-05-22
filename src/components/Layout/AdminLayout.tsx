"use client";

import React from 'react'
import Breadcrumb from '../Primitives/Breadcrumb/Breadcrumb'
import PublishDropdown from '../admin/PublishDropdown'


export type AdminLayoutProps = {
    title: string
    breadcrumbItems: {
        label: string
        url?: string
    }[],
    headerAction?: React.ReactNode
    children: React.ReactNode
}


export default function AdminLayout({
    title,
    breadcrumbItems,
    headerAction = <PublishDropdown />,
    children,
}: AdminLayoutProps) {
    return (
        <div className="w-full flex flex-col gap-32 px-104 pt-32 pb-64 admin-page">
            <div className="w-full flex flex-col gap-64 pb-32">
                <div className="w-full">
                    <Breadcrumb
                        items={breadcrumbItems.map((item) => ({ ...item, url: item.url ?? "#" }))}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <h1 className="text-2xl-bold text-brand-blue-secondary max-w-[696px]">
                        {title}
                    </h1>
                    {headerAction}
                </div>
            </div>
            <div>
                {children}
            </div>
        </div>
    )
}
