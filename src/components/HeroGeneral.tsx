'use client';

import React from 'react';
import { Breadcrumb } from '@ama-pt/agora-design-system';

interface HeroGeneralProps {
  title: React.ReactNode;
  breadcrumbItems?: { label: string; url: string }[];
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  variant?: 'dark' | 'light';
  backgroundImageUrl?: string;
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
  breadcrumbItems,
  subtitle,
  children,
  variant = 'dark',
  backgroundImageUrl = "/Banner/hero-bg.png",
  image,
  className = '',
}: HeroGeneralProps) {
  const isLight = variant === 'light';

  return (
    <div
      className={` ${!className.includes('bg-') ? (isLight ? 'bg-accent-light' : 'bg-primary-900') : ''} ${className}`}
      style={isLight || className.includes('bg-white') ? {} : {
        backgroundImage: `url("${backgroundImageUrl}")`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "right top 10%",
      }}
    >
      <div className='w-full flex flex-col items-center justify-center bg-gradient-to-r from-secondary-900 via-secondary-900/[64%] to-secondary-900/[24%]'>

        <div className="container flex flex-col gap-32 py-64">
          {/* Breadcrumbs Section */}
          {breadcrumbItems && breadcrumbItems.length > 0 && (
            <Breadcrumb
              darkMode={!isLight}
              items={breadcrumbItems}
            />
          )}
          {/* Content Section (Title & Subtitle) */}
          <div className="max-w-2xl flex flex-col gap-16">
            <h1 className="text-white flex flex-col items-start leading-tight">
              <span className="text-2xl-bold">
                {title}
              </span>
            </h1>
            <span className="text-white text-m-regular">
              {subtitle}
            </span>
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



