import { getFaqs } from "@/service/queries/faqs/faqs";
import { Typograph } from '@/components/Shared/Generics/Typograph';
import { Hero } from '@/components/Shared/Hero';
import SimpleSiteMap from '@/components/Shared/SiteMap/SimpleSiteMap'
import { parseHtmlToParagraphs } from '@/utils/htmlToParagraphs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'

import { Metadata } from "next";
import Anchor from "@/components/Shared/Anchor";
import initTranslations from "@/app/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  {
    params,
  }: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  const { locale } = await params;
  const { title } = await getFaqs("termos-de-utilizacao", locale);

  return {
    title,
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { t, i18n } = await initTranslations({ locale, namespaces: ["common"] });
  const remarkPlugins = [remarkGfm]
  const rehypePlugins = [rehypeRaw, rehypeSanitize]
  const { hero, sitemap, paragraph } = await getFaqs("termos-de-utilizacao", locale);

  return (
    <main className="w-full h-full flex flex-col items-center justify-center ">
      <Hero.Root>
        <Hero.Breadcrumb />
        <Hero.Content>
          <Hero.Title>{hero.title}</Hero.Title>
          <Hero.Description description={parseHtmlToParagraphs(hero.description)} />
          <Hero.Description description={t("search.updatedOn", { date: (new Date(hero.updatedAt).toLocaleDateString(i18n.language)).replaceAll("/", ".") })} />

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
            className="[&_.children-wrapper]:text-m-regular!"
          />
        </div>
        <div className="col-span-12 md:col-span-9 flex flex-col gap-64 pl-64 h-full">
          {paragraph.map((item, index) => (
            <div className='w-full flex flex-col gap-24' id={item.id} key={index}>
              <Typograph tag='h2' className='text-xl-bold text-neutral-900'>
                {item.title}
              </Typograph>
              <div className='roadmap-block'>
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
