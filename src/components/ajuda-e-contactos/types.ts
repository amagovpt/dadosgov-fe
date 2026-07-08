export type RichAnswerKey =
  | "publicar"
  | "usar-dados"
  | "apis"
  | "legais"
  | "problemas-tecnicos"
  | "pedidos-dados"
  | "outros"
  | "emblema"
  | true;

export interface FaqItem {
  question: string;
  answer: string;
  richAnswer?: RichAnswerKey;
  defaultExpanded?: boolean;
}

export interface FaqCategory {
  category: string;
  items: FaqItem[];
}

export type SupportToggle = "question" | "bug" | "feedback" | "dataset";

export interface SupportFormErrors {
  email: string;
  subject: string;
  description: string;
  category: string;
}
