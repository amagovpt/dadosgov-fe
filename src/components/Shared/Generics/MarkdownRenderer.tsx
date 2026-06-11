import React from 'react'
import ReactMarkdown from 'react-markdown'
import Anchor from '../Anchor'

export default function MarkdownRenderer({ children }: { children: string }) {
    return (
        <ReactMarkdown
            components={{
                h1: ({ children }) => <h1 className="text-2xl-bold">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl-bold">{children}</h2>,
                a: ({ href, children }) => (
                    <Anchor href={href}>
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
            {children}
        </ReactMarkdown>
    )
}
