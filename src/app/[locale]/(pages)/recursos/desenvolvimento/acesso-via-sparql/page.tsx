import ReactMarkdown from "react-markdown";
import { getFaqs } from "@/service/queries/faqs/faqs";
import BreadcrumbDynamic from "@/components/Shared/BreadcrumbDynamic";
import Anchor from "@/components/Shared/Anchor";

export const dynamic = "force-dynamic";

export default async function page() {
  const { title, actionTitle, body, actions } = await getFaqs(
    "acesso-ao-catalogo-via-sparql",
    "pt"
  );

  return (
    <main className="flex h-full w-full flex-col items-center justify-center">
      <div className="container flex flex-col py-32">
        <BreadcrumbDynamic darkMode={false} />
      </div>
      <div className="container flex flex-col gap-16 py-32 font-sans leading-3 text-primary-900">
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h1 className="text-2xl-bold">{children}</h1>,
            h2: ({ children }) => <h2 className="text-xl-bold">{children}</h2>,
            a: ({ href, children }) => (
              <Anchor href={href} appearance="link" className="!min-h-[12px] !min-w-[12px] !py-0">
                {children}
              </Anchor>
            ),
            code: ({ children }) => <code className="bg-neutral-100">{children}</code>,
            pre: ({ children }) => <pre className="bg-neutral-100 leading-7">{children}</pre>,
            ol: ({ children }) => (
              <ol className="list-decimal pl-6 [&_li::marker]:font-bold">{children}</ol>
            ),
            ul: ({ children }) => <ul className="list-disc pl-6">{children}</ul>,
            li: ({ children }) => <li className="ml-32">{children}</li>,
          }}
        >
          {body}
        </ReactMarkdown>
      </div>
      {actions && actions.length > 0 && (
        <div className="container flex flex-col gap-16 pb-32">
          <div className="flex w-full flex-col gap-16 text-primary-900">
            <h2 className="text-2xl-bold">{actionTitle}</h2>
          </div>
          <ul className="pl-6">
            {actions.map((action, index) => (
              <li key={index} className="ml-32">
                <Anchor
                  href={action.href || "#"}
                  hasIcon={true}
                  trailingIcon="agora-line-external-link"
                  trailingIconHover="agora-solid-external-link"
                >
                  {action.children}
                </Anchor>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
