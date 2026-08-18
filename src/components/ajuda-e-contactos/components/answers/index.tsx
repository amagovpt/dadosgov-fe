"use client";

import React from "react";
import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface FaqAnswerProps {
  plainAnswer: string;
}

export function FaqAnswer({ plainAnswer }: FaqAnswerProps) {
  const answerSegments = plainAnswer.split(/<p>\s*<\/p>/g);

  return (
    <div className="[&_a]:inline-block [&_a]:p-[2px] [&_a]:text-m-regular [&_a]:text-neutral-900 [&_a]:underline [&_a]:[text-decoration-color:var(--color-neutral-900)] [&_a]:[text-decoration-thickness:.094rem] [&_a]:[text-underline-offset:.388rem]">
      {answerSegments.map((segment, index) => (
        <React.Fragment key={index}>
          {index > 0 ? <div className="h-16" /> : null}
          {formatHtmlParagraphs(segment)}
        </React.Fragment>
      ))}
    </div>
  );
}
