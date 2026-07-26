"use client";

import React from 'react'
import { Icon } from "@ama-pt/agora-design-system"
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

function AdminBreadcrumb({ items }: { items: AdminLayoutProps["breadcrumbItems"] }) {
    return (
        <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-12 text-base text-neutral-900">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1

                    return (
                        <React.Fragment key={`${item.label}-${index}`}>
                            <li>
                                <span className={isLast ? undefined : "border-b-2 border-neutral-900 pb-8"}>
                                    {item.label}
                                </span>
                            </li>
                            {!isLast && (
                                <li aria-hidden="true" className="flex items-center">
                                    <Icon name="agora-line-chevron-right" className="h-16 w-16" />
                                </li>
                            )}
                        </React.Fragment>
                    )
                })}
            </ol>
        </nav>
    )
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
                    <AdminBreadcrumb items={breadcrumbItems} />
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
