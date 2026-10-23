"use client";

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Breadcrumb from '../Primitives/Breadcrumb/Breadcrumb'
import PublishDropdown from '../admin/PublishDropdown'
import { buildAdminBreadcrumbItems, type AdminBreadcrumbItem } from '@/utils/adminBreadcrumbs'
import { localizeHref } from '@/utils/localizeHref'
import { splitLocale } from '@/utils/stripLocale'
import { twMerge } from 'tailwind-merge'

export type AdminLayoutProps = {
    className?: string
    title: string
    kicker?: string
    description?: string
    /** Section and detail items; the layout adds the administration root. */
    breadcrumbItems: AdminBreadcrumbItem[],
    headerAction?: React.ReactNode
    headerClassName?: string
    headerMeta?: React.ReactNode
    headerInfoClassName?: string
    hideHeader?: boolean
    children: React.ReactNode
}

export default function AdminLayout({
    className,
    title,
    kicker,
    description,
    breadcrumbItems,
    headerAction = <PublishDropdown />,
    headerClassName,
    headerMeta,
    headerInfoClassName,
    hideHeader = false,
    children,
}: AdminLayoutProps) {
    const { t } = useTranslation('admin-common')
    const router = useRouter()
    const { locale } = splitLocale(usePathname())

    // Agora renders the crumbs as plain anchors, so a click would reload the page and
    // drop the active profile held in memory for unscoped routes. Navigate client-side
    // instead; modified clicks (new tab/window) are left to the browser.
    const handleBreadcrumbClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const anchor = (event.target as HTMLElement).closest('a')
        if (!anchor) return
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return
        }
        const href = anchor.getAttribute('href') ?? ''
        if (!href || href === '#') {
            event.preventDefault()
            return
        }
        if (href.startsWith('/') && !href.startsWith('//')) {
            event.preventDefault()
            router.push(localizeHref(href, locale))
        }
    }

    return (
        <div className={twMerge("container flex flex-col gap-32 pt-64 pb-96", className)}>
            <div className="w-full flex flex-col gap-32">
                <div className="w-full">
                    <Breadcrumb
                        items={buildAdminBreadcrumbItems({ t, items: breadcrumbItems })}
                        validateUrls={false}
                        onClickCapture={handleBreadcrumbClick}
                    />
                </div>

                {!hideHeader && <div className={twMerge("w-full flex flex-col items-start gap-24 xl:flex-row xl:items-end xl:justify-between", headerClassName)}>
                    <div className={twMerge("flex flex-col gap-8 max-w-[696px]", headerInfoClassName)}>
                        {kicker && <span className="text-sm text-neutral-700">{kicker}</span>}
                        <h1 className="text-2xl-bold text-brand-blue-secondary">
                            {title}
                        </h1>
                        {headerMeta}
                        {description && <p className="text-base text-neutral-700">{description}</p>}
                    </div>
                    {headerAction}
                </div>}
            </div>
            <>
                {children}
            </>
        </div>
    )
}
