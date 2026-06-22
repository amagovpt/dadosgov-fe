import React from 'react'
import ReactMarkdown from 'react-markdown';
import { getFaqs } from '@/service/queries/faqs/faqs';
import Breadcrumb from '@/components/Primitives/Breadcrumb/Breadcrumb';
import Anchor from '@/components/Shared/Anchor';
import { Metadata } from 'next';

export const dynamic = "force-dynamic";

export async function generateMetadata({
  //params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { title } = await getFaqs("licenses", "pt");

  return {
    title,
  };
}

export default async function page() {
  const { title, actionTitle, body, actions } = await getFaqs("licenses", "pt")

  return (
    <main className="w-full h-full flex flex-col items-center justify-center">
      <div className="container flex flex-col py-32">
        <Breadcrumb
          items={[
            { label: 'Home', url: '/' },
            { label: 'FAQs', url: '/faqs/' },
            { label: title, url: '#' },
          ]}
        />
      </div>
      <div className="container flex flex-col gap-16 py-32 font-sans text-primary-900">
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h1 className="text-2xl-bold">{children}</h1>,
            h2: ({ children }) => <h2 className="text-xl-bold">{children}</h2>,
            a: ({ href, children }) => (
              <Anchor href={href} appearance='link' className="!py-0 !min-h-[12px] !min-w-[12px]" >
                {children}
              </Anchor>
            ),
            code: ({ children }) => (<code className="bg-neutral-100 text-wrap">{children}</code>),
            pre: ({ children }) => (<pre className="bg-neutral-100 leading-6">{children}</pre>),
            ol: ({ children }) => <ol className="list-decimal pl-6 [&_li::marker]:font-bold">{children}</ol>,
            ul: ({ children }) => <ul className="list-disc pl-6">{children}</ul>,
            li: ({ children }) => <li className="ml-32">{children}</li>,
          }}
        >
          {body}
        </ReactMarkdown>
      </div>
      {actions && actions.length > 0 && (
        <div className="container flex flex-col gap-16 pb-32">
          <div className="text-primary-900 w-full flex flex-col gap-16">
            <h2 className="text-2xl-bold">{actionTitle}</h2>
          </div>
          <ul className="pl-6">

            {actions.map((action, index) => (<li key={index} className="ml-32">
              <Anchor href={action.href || "#"} hasIcon={true} trailingIcon="agora-line-external-link" trailingIconHover="agora-solid-external-link">
                {action.children}
              </Anchor>
            </li>))}
          </ul>
        </div>
      )}
    </main>
  )
}
