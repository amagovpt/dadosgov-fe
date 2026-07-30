"use client";

import { formatHtmlParagraphs } from "@/utils/formatHtmlParagraphs";

interface FaqAnswerProps {
  plainAnswer: string;
}

export function FaqAnswer({ plainAnswer }: FaqAnswerProps) {
  return <>{formatHtmlParagraphs(plainAnswer)}</>;
}
