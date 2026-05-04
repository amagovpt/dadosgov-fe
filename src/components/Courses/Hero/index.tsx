"use client";
import Image from "next/image";
import { Breadcrumb } from "@ama-pt/agora-design-system";
import dayjs from "dayjs";
import { parseHtmlToParagraphs } from "@/utils/htmlToParagraphs";


export interface HeroCoursesProps {
    title: string;
    description: string;
    updatedAt?: string;
    img?: {
        src: string;
        alt?: string;
    }
    breadcrumbItems: {
        label: string;
        url: string;
    }[]
}

export default function HeroCourses(args: HeroCoursesProps) {
    return (
        <div className="bg-primary-100 w-full py-64 flex items-center justify-center">
            <div className="container">
                <Breadcrumb
                    items={args.breadcrumbItems}
                    className="mb-64"
                />
                <div className="flex lg:flex-row flex-col items-center gap-64">
                    <div className="w-full">
                        <h1 className="text-3xl-bold text-primary-600 mb-32">
                            {parseHtmlToParagraphs(args.title)}
                        </h1>

                        <div className="text-m-regular space-y-16 w-full">
                            {args.description.split("\n").map((paragraph, index) => (
                                <p key={index}>{parseHtmlToParagraphs(paragraph)}</p>
                            ))}
                        </div>

                        <div className="mt-64">
                            Atualizado em {args.updatedAt ? dayjs(args.updatedAt).format('DD.MM.YYYY') : <span className="text-m-bold">Data de atualização indisponível</span>}
                        </div>
                    </div>
                    {
                        args.img && (<div className="w-full h-full flex items-center justify-center">
                            <Image src={args.img?.src} alt={args.img.alt || ""} width={597} height={390} unoptimized/>
                        </div>)
                    }

                </div>
            </div>
        </div>

    )
}
