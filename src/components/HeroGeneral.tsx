'use client';

import React from 'react';
import BreadcrumbDynamic from '@/components/Shared/BreadcrumbDynamic';
import { twJoin } from 'tailwind-merge';

interface HeroGeneralProps {
  title: React.ReactNode;
  /** Render the route-derived breadcrumb. Default `true`. */
  hasBreadcrumb?: boolean;
  /** Label overrides for intermediate dynamic segments, keyed by raw segment. */
  breadcrumbOverrides?: Record<string, React.ReactNode>;
  /** Label for the last crumb (a CMS/API title). */
  breadcrumbCurrentLabel?: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  variant?: 'dark' | 'light';
  backgroundImageUrl?: string | null;
  backgroundPosition?: string;
  image?: {
    src: string;
    alt: string;
    className?: string;
  };
  className?: string;
}

export default function HeroGeneral({
  title,
  hasBreadcrumb = true,
  breadcrumbOverrides,
  breadcrumbCurrentLabel,
  subtitle,
  children,
  variant = 'dark',
  backgroundImageUrl = "/Banner/hero-bg.png",
  backgroundPosition = "right top 10%",
  image,
  className = '',
}: HeroGeneralProps) {
  const isLight = variant === 'light';

  return (
    <div
      className={`w-full ${!className.includes('bg-') ? (isLight ? 'bg-accent-light' : 'bg-primary-900') : ''} ${className}`}
      style={isLight || className.includes('bg-white') ? {} : {
        backgroundImage: `url("${backgroundImageUrl}")`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition,
      }}
    >
      <div className={twJoin('w-full flex flex-col items-center justify-center', backgroundImageUrl && "bg-gradient-to-r from-secondary-900 via-secondary-900/[64%] to-secondary-900/[24%]")}>

        <div className="container flex flex-col gap-32 py-64">
          {/* Breadcrumbs Section */}
          {hasBreadcrumb && (
            <BreadcrumbDynamic
              darkMode={!isLight}
              overrides={breadcrumbOverrides}
              currentLabel={breadcrumbCurrentLabel}
            />
          )}
          {/* Content Section (Title & Subtitle) */}
          <div className="max-w-2xl flex flex-col gap-16">
            {title && (
              <h1 className="text-white flex flex-col items-start leading-tight">
                <span className="text-2xl-bold">
                  {title}
                </span>
              </h1>
            )}
            {subtitle && (
              <span className="text-white text-m-regular">
                {subtitle}
              </span>
            )}
          </div>
          {/* Search/Children Section */}
          {(children || image) && (
            <div className="container grid xs:grid-cols-4 md:grid-cols-8 xl:grid-cols-12 gap-32 px-4">
              <div className="xs:col-span-4 md:col-span-7 xl:col-span-7">
                {children}
              </div>
              {image && (
                <div className="flex justify-end items-center">
                  <div className="image-container mb-16 last:mb-0">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className={`max-w-full h-auto object-contain drop-shadow-xl ${image.className || ''}`}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



