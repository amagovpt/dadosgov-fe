"use client";
import Image from "next/image";
import BreadcrumbDynamic from "@/components/Shared/BreadcrumbDynamic";
import dayjs from "dayjs";
import { parseHtmlToParagraphs } from "@/utils/htmlToParagraphs";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";
import { useTranslation } from "react-i18next";

export interface HeroCoursesProps {
  title: string;
  description: string;
  updatedAt?: string;
  img?: {
    src: string;
    alt?: string;
  };
  /** Render the route-derived breadcrumb. Default `true`. */
  hasBreadcrumb?: boolean;
  /** Label overrides for intermediate dynamic segments, keyed by raw segment. */
  breadcrumbOverrides?: Record<string, React.ReactNode>;
  /** Label for the last crumb (a CMS/API title). */
  breadcrumbCurrentLabel?: React.ReactNode;
}

export default function HeroCourses(args: HeroCoursesProps) {
  const { t } = useTranslation("learning");
  return (
    <div className="flex w-full items-center justify-center bg-primary-100 py-64">
      <div className="container">
        {(args.hasBreadcrumb ?? true) && (
          <BreadcrumbDynamic
            darkMode={false}
            overrides={args.breadcrumbOverrides}
            currentLabel={args.breadcrumbCurrentLabel}
            className="mb-64"
          />
        )}
        <div className="flex flex-col items-center gap-64 lg:flex-row">
          <div className="w-full">
            <h1 className="mb-32 text-3xl-bold text-primary-600">
              {parseHtmlToParagraphs(args.title)}
            </h1>

            <div className="w-full space-y-16">
              {formatHtmlParagraphs(args.description, "text-m-regular")}
            </div>

            <div className="mt-64">
              {args.updatedAt ? t("updatedAt", { date: dayjs(args.updatedAt).format("DD.MM.YYYY") }) : (
                <span className="text-m-bold">{t("dateUnavailable")}</span>
              )}
            </div>
          </div>
          {args.img && (
            <div className="flex h-full w-full items-center justify-center">
              <Image
                src={args.img?.src}
                alt={args.img.alt || ""}
                width={597}
                height={390}
                unoptimized
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
