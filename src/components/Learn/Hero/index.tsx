"use client";
import Image from "next/image";
import Breadcrumb from "@/components/Primitives/Breadcrumb/Breadcrumb";
import dayjs from "dayjs";
import { parseHtmlToParagraphs } from "@/utils/htmlToParagraphs";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

export interface HeroCoursesProps {
  title: string;
  description: string;
  updatedAt?: string;
  img?: {
    src: string;
    alt?: string;
  };
  breadcrumbItems: {
    label: string;
    url: string;
  }[];
}

export default function HeroCourses(args: HeroCoursesProps) {
  return (
    <div className="flex w-full items-center justify-center bg-primary-100 py-64">
      <div className="container">
        <Breadcrumb items={args.breadcrumbItems} className="mb-64" />
        <div className="flex flex-col items-center gap-64 lg:flex-row">
          <div className="w-full">
            <h1 className="mb-32 text-3xl-bold text-primary-600">
              {parseHtmlToParagraphs(args.title)}
            </h1>

            <div className="w-full space-y-16">
              {formatHtmlParagraphs(args.description, "text-m-regular")}
            </div>

            <div className="mt-64">
              Atualizado em{" "}
              {args.updatedAt ? (
                dayjs(args.updatedAt).format("DD.MM.YYYY")
              ) : (
                <span className="text-m-bold">Data de atualização indisponível</span>
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
