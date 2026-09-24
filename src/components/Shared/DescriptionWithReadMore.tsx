"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { ExpandableDescription } from "./ExpandableDescription";

interface DescriptionWithReadMoreProps {
  text: string;
  sidebarRef: React.RefObject<HTMLDivElement | null>;
  titleRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
  extraContent?: React.ReactNode;
}

export function DescriptionWithReadMore({ text, ...props }: DescriptionWithReadMoreProps) {
  return (
    <ExpandableDescription {...props}>
      <div className="content-wrapper markdown-container rich-text-content text-m-light text-neutral-900">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
          {text}
        </ReactMarkdown>
      </div>
    </ExpandableDescription>
  );
}
