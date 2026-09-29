import React from "react";
import ReactMarkdown from "react-markdown";
import { getFaqs } from "@/service/queries/faqs/faqs";
import BreadcrumbDynamic from "@/components/Shared/BreadcrumbDynamic";
import Anchor from "@/components/Shared/Anchor";
import { Metadata } from "next";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Hero } from "@/components/Shared/Hero";
import { parseHtmlToParagraphs } from "@/utils/htmlToParagraphs";
import SimpleSiteMap from "@/components/Shared/SiteMap/SimpleSiteMap";
import { Typograph } from "@/components/Shared/Generics/Typograph";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  {
    params,
  }: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  const { locale } = await params;
  const { title } = await getFaqs("licenses", locale);

  return {
    title,
  };
}

export default async function page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const remarkPlugins = [remarkGfm]
  const rehypePlugins = [rehypeRaw, rehypeSanitize]
  const { hero, sitemap, paragraph } = await getFaqs("licenses", locale);

  return (
    <main className="w-full h-full flex flex-col items-center justify-center ">
      <Hero.Root>
        <Hero.Breadcrumb />
        <Hero.Content>
          <Hero.Title>{hero.title}</Hero.Title>
          <Hero.Description description={parseHtmlToParagraphs(hero.description)} />
        </Hero.Content>
      </Hero.Root>
      <div className="container grid grid-cols-12 gap-32 pt-64 pb-96 roadmap-page">
        <div className="md:col-span-3 hidden md:block">
          <SimpleSiteMap
            title={sitemap.title}
            anchor={sitemap.links.map(anchor => ({
              children: anchor.children,
              href: anchor.href,
            }))}
          />
        </div>
        <div className="col-span-12 md:col-span-9 flex flex-col gap-64 pl-64 h-full ">
          {paragraph.map((item, index) => (
            <div className='w-full flex flex-col gap-24' id={item.id} key={index}>
              <Typograph tag='h2' className='text-xl-bold text-neutral-900'>
                {item.title}
              </Typograph>
              <div className='roadmap-block gap-16 flex flex-col'>
                <ReactMarkdown
                  remarkPlugins={remarkPlugins}
                  rehypePlugins={rehypePlugins}
                  components={{
                    h2: ({ children }) => <h2 className="text-xl-bold text-primary-900">{children}</h2>,
                    a: ({ href, children }) => (
                      <Anchor href={href} appearance='link' className="py-0! min-h-12! min-w-12!" >
                        {children}
                      </Anchor>
                    ),
                    strong: ({ children }) => <strong className='text-m-semibold'>{children}</strong>,
                    ol: ({ children }) => <ol className="list-decimal pl-6 [&_li::marker]:font-bold">{children}</ol>,
                    ul: ({ children }) => <ul className="list-disc pl-6">{children}</ul>,
                    li: ({ children }) => <li className="ml-32">{children}</li>,
                  }}
                >
                  {item.description}
                </ReactMarkdown>
              </div>
            </div>
          ))}
        </div >
      </div >
    </main >
  );
}
